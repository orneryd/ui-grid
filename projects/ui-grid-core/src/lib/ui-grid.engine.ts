import { buildGridPipeline } from './grid.core';
import type { BuildGridPipelineContext, PipelineResult } from './grid.core';

export interface GridEngine {
  buildPipeline(context: BuildGridPipelineContext): PipelineResult;
}

export interface RustWasmGridEngineBindings {
  buildPipeline(context: BuildGridPipelineContext): PipelineResult;
}

let registeredRustWasmBindings: RustWasmGridEngineBindings | null = null;

export function registerRustWasmGridEngine(bindings: RustWasmGridEngineBindings): void {
  registeredRustWasmBindings = bindings;
}

export function clearRustWasmGridEngine(): void {
  registeredRustWasmBindings = null;
}

export function activeGridEngineBackend(): 'rust-wasm' | 'typescript' {
  return registeredRustWasmBindings ? 'rust-wasm' : 'typescript';
}

class RustBackedGridEngine implements GridEngine {
  buildPipeline(context: BuildGridPipelineContext): PipelineResult {
    if (registeredRustWasmBindings) {
      return registeredRustWasmBindings.buildPipeline(context);
    }

    return buildGridPipeline(context);
  }
}

export const defaultGridEngine: GridEngine = new RustBackedGridEngine();
