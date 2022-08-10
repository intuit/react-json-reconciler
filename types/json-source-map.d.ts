declare module "json-source-map" {
  export interface PointerLocation {
    line: number;
    column: number;
    pos: number;
  }
  export interface Pointer {
    value: PointerLocation;
    valueEnd: PointerLocation;
  }

  export interface PropPointer extends Pointer {
    key: PointerLocation;
    keyEnd: PointerLocation;
  }

  export function stringify(
    data: any,
    replacement?: null,
    spacing?: number
  ): {
    json: any;
    pointers: Record<string, Pointer | PropPointer>;
  };
}
