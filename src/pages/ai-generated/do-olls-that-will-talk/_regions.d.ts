// Typed ambient declaration for the WaveSurfer RegionsPlugin CDN ESM build.
// This removes the @ts-expect-error on the CDN import in _score.ts.

declare module "https://cdn.jsdelivr.net/npm/wavesurfer.js@7/dist/plugins/regions.esm.js" {
  export interface RegionParams {
    start: number;
    end: number;
    color?: string;
    content?: string;
    resize?: boolean;
    drag?: boolean;
    id?: string;
  }

  export interface Region {
    start: number;
  }

  export interface RegionsPluginInstance {
    addRegion(params: RegionParams): Region;
    on(
      event: "region-clicked",
      fn: (region: Region, event: { stopPropagation(): void }) => void
    ): void;
  }

  const RegionsPlugin: {
    create(): RegionsPluginInstance;
  };

  export default RegionsPlugin;
}
