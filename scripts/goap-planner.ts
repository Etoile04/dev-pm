#!/usr/bin/env npx tsx
/**
 * GOAP Planner for Dev-PM — 移植自 Ruflo (github.com/ruvnet/ruflo)
 * License: MIT (original) / MIT (this adaptation)
 * 
 * Source: v3/goal_ui/src/lib/goapPlanner.ts
 * Adapted for: dev-pm SKILL.md §4.1 GOAP 目标分解
 * 
 * 用法:
 *   npx tsx goap-planner.ts --goal '<goal_state_json>' --initial '<initial_state_json>' --actions '<actions_json>'
 *   或 pipe JSON:
 *   echo '{"goal":{...},"initial":{...},"actions":[...]}' | npx tsx goap-planner.ts
 * 
 * 输出: JSON 格式的 Task 序列（按最优执行顺序）
 */

// ============================================================
// Core Types (from Ruflo goapPlanner.ts)
// ============================================================

export interface Action {
  name: string;
  cost: number;
  preconditions: Record<string, boolean>;
  effects: Record<string, boolean>;
  /** Dev-PM extensions */
  assign_to?: "subagent" | "exec" | "main";
  files?: string[];
  test?: string;
}

export interface PlanStep {
  id: string;
  action: string;
  cost: number;
  deps: string[];       // which steps must complete first
  preconditions: Record<string, boolean>;
  effects: Record<string, boolean>;
  assign_to: string;
  files: string[];
  test: string;
}

export interface PlanResult {
  ok: boolean;
  steps: PlanStep[];
  total_cost: number;
  goal_met: boolean;
  error?: string;
  metadata: {
    actions_evaluated: number;
    search_iterations: number;
    source: "goap-astar" | "greedy-fallback";
  };
}

// ============================================================
// GOAP Planner (A* Search — from Ruflo, adapted)
// ============================================================

export class GOAPPlanner {
  private actions: Action[];

  constructor(actions: Action[]) {
    this.actions = actions;
  }

  /**
   * Heuristic: count unmet goal conditions (admissible)
   */
  private heuristic(state: Record<string, boolean>, goal: Record<string, boolean>): number {
    let distance = 0;
    for (const key in goal) {
      if (goal[key] && !state[key]) {
        distance++;
      }
    }
    return distance;
  }

  /**
   * Check if all preconditions are met
   */
  private preconditionsMet(
    state: Record<string, boolean>,
    preconditions: Record<string, boolean>
  ): boolean {
    for (const key in preconditions) {
      if (preconditions[key] && !state[key]) {
        return false;
      }
    }
    return true;
  }

  /**
   * Apply action effects to state
   */
  private applyEffects(
    state: Record<string, boolean>,
    effects: Record<string, boolean>
  ): Record<string, boolean> {
    return { ...state, ...effects };
  }

  /**
   * Find optimal plan using A* search
   * Returns ordered list of actions to achieve goalState from currentState
   */
  public plan(
    currentState: Record<string, boolean>,
    goalState: Record<string, boolean>,
    maxIterations: number = 1000
  ): { actions: Action[]; iterations: number } {
    interface Node {
      state: Record<string, boolean>;
      actions: Action[];
      cost: number;
      heuristic: number;
    }

    const openList: Node[] = [];
    const closedSet: Set<string> = new Set();
    let iterations = 0;

    openList.push({
      state: { ...currentState },
      actions: [],
      cost: 0,
      heuristic: this.heuristic(currentState, goalState),
    });

    while (openList.length > 0 && iterations < maxIterations) {
      iterations++;

      // Pick node with lowest f = cost + heuristic
      openList.sort((a, b) => (a.cost + a.heuristic) - (b.cost + b.heuristic));
      const current = openList.shift()!;
      const stateKey = JSON.stringify(current.state);

      // Goal reached
      if (this.heuristic(current.state, goalState) === 0) {
        return { actions: current.actions, iterations };
      }

      if (closedSet.has(stateKey)) continue;
      closedSet.add(stateKey);

      // Expand: try each applicable action
      for (const action of this.actions) {
        if (this.preconditionsMet(current.state, action.preconditions)) {
          const newState = this.applyEffects(current.state, action.effects);
          const newStateKey = JSON.stringify(newState);

          if (!closedSet.has(newStateKey)) {
            openList.push({
              state: newState,
              actions: [...current.actions, action],
              cost: current.cost + action.cost,
              heuristic: this.heuristic(newState, goalState),
            });
          }
        }
      }
    }

    // No plan found
    return { actions: [], iterations };
  }
}

// ============================================================
// Greedy Fallback (when A* fails or is too slow)
// ============================================================

export function greedyFallback(
  currentState: Record<string, boolean>,
  goalState: Record<string, boolean>,
  actions: Action[]
): Action[] {
  const result: Action[] = [];
  let state = { ...currentState };
  const used = new Set<string>();
  let stuck = false;

  while (this_heuristic(state, goalState) > 0 && !stuck) {
    let bestAction: Action | null = null;
    let bestScore = -1;

    for (const action of actions) {
      if (used.has(action.name)) continue;
      if (!precondsMet(state, action.preconditions)) continue;

      const newState = { ...state, ...action.effects };
      const score = this_heuristic(state, goalState) - this_heuristic(newState, goalState);
      if (score > bestScore) {
        bestScore = score;
        bestAction = action;
      }
    }

    if (bestAction) {
      result.push(bestAction);
      state = { ...state, ...bestAction.effects };
      used.add(bestAction.name);
    } else {
      stuck = true; // no applicable action
    }
  }

  return result;
}

function this_heuristic(state: Record<string, boolean>, goal: Record<string, boolean>): number {
  let d = 0;
  for (const key in goal) {
    if (goal[key] && !state[key]) d++;
  }
  return d;
}

function precondsMet(state: Record<string, boolean>, preconds: Record<string, boolean>): boolean {
  for (const key in preconds) {
    if (preconds[key] && !state[key]) return false;
  }
  return true;
}

// ============================================================
// Dev-PM Integration: Convert Actions → PlanSteps with deps
// ============================================================

export function actionsToPlanSteps(actions: Action[]): PlanStep[] {
  const steps: PlanStep[] = [];
  const achievedState: Record<string, boolean> = {};

  for (let i = 0; i < actions.length; i++) {
    const action = actions[i];

    // Find deps: which previous steps produced the preconditions this action needs
    const deps: string[] = [];
    for (const precond in action.preconditions) {
      if (action.preconditions[precond]) {
        // Find the step that produced this precondition
        for (const prevStep of steps) {
          if (prevStep.effects[precond] && !deps.includes(prevStep.id)) {
            deps.push(prevStep.id);
          }
        }
      }
    }

    const step: PlanStep = {
      id: `T${i + 1}`,
      action: action.name,
      cost: action.cost,
      deps,
      preconditions: action.preconditions,
      effects: action.effects,
      assign_to: action.assign_to || "subagent",
      files: action.files || [],
      test: action.test || "",
    };

    steps.push(step);

    // Track what this step achieves
    for (const key in action.effects) {
      achievedState[key] = action.effects[key];
    }
  }

  return steps;
}

// ============================================================
// CLI Entry Point
// ============================================================

async function main() {
  const args = process.argv.slice(2);

  let goalState: Record<string, boolean>;
  let initialState: Record<string, boolean>;
  let actions: Action[];

  // Parse arguments
  if (args.length === 0 && !process.stdin.isTTY) {
    // Pipe mode
    const input = await new Promise<string>((resolve) => {
      let data = "";
      process.stdin.on("data", (chunk) => (data += chunk));
      process.stdin.on("end", () => resolve(data));
    });
    const parsed = JSON.parse(input);
    goalState = parsed.goal;
    initialState = parsed.initial;
    actions = parsed.actions;
  } else {
    // CLI args mode
    const getArg = (name: string): string | null => {
      const idx = args.indexOf(name);
      return idx >= 0 && idx + 1 < args.length ? args[idx + 1] : null;
    };

    const goalStr = getArg("--goal");
    const initialStr = getArg("--initial");
    const actionsStr = getArg("--actions");

    if (!goalStr || !initialStr || !actionsStr) {
      console.error("Usage: goap-planner.ts --goal '{...}' --initial '{...}' --actions '[...]'");
      console.error("   or: echo '{goal,initial,actions}' | goap-planner.ts");
      process.exit(1);
    }

    goalState = JSON.parse(goalStr);
    initialState = JSON.parse(initialStr);
    actions = JSON.parse(actionsStr);
  }

  // Run A* planner
  const planner = new GOAPPlanner(actions);
  const { actions: planActions, iterations } = planner.plan(initialState, goalState);

  let result: PlanResult;

  if (planActions.length > 0) {
    // A* succeeded
    const steps = actionsToPlanSteps(planActions);
    result = {
      ok: true,
      steps,
      total_cost: planActions.reduce((sum, a) => sum + a.cost, 0),
      goal_met: true,
      metadata: {
        actions_evaluated: actions.length,
        search_iterations: iterations,
        source: "goap-astar",
      },
    };
  } else {
    // A* failed → greedy fallback
    const greedyActions = greedyFallback(initialState, goalState, actions);
    if (greedyActions.length > 0) {
      const steps = actionsToPlanSteps(greedyActions);
      result = {
        ok: true,
        steps,
        total_cost: greedyActions.reduce((sum, a) => sum + a.cost, 0),
        goal_met: this_heuristic(
          greedyActions.reduce(
            (s, a) => ({ ...s, ...a.effects }),
            { ...initialState } as Record<string, boolean>
          ),
          goalState
        ) === 0,
        metadata: {
          actions_evaluated: actions.length,
          search_iterations: iterations,
          source: "greedy-fallback",
        },
      };
    } else {
      result = {
        ok: false,
        steps: [],
        total_cost: 0,
        goal_met: false,
        error: "No viable plan found. Check preconditions and actions.",
        metadata: {
          actions_evaluated: actions.length,
          search_iterations: iterations,
          source: "goap-astar",
        },
      };
    }
  }

  console.log(JSON.stringify(result, null, 2));
}

main().catch((err) => {
  console.error(JSON.stringify({ ok: false, error: err.message, steps: [], total_cost: 0, goal_met: false, metadata: { actions_evaluated: 0, search_iterations: 0, source: "goap-astar" } }));
  process.exit(1);
});
