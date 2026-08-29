<script setup lang="ts">
import { computed } from "vue";
import DottedMap from "dotted-map";

interface Dot {
  start: { lat: number; lng: number; label?: string };
  end: { lat: number; lng: number; label?: string };
}
interface Props {
  dots?: Array<Dot>;
  class?: string;
  lineColor?: string;
  mapColor: string;
  mapBgColor: string;
}

const props = withDefaults(defineProps<Props>(), {
  dots: () => [],
  lineColor: "#0EA5E9",
});

const DottedMapCtor = (DottedMap as any).default ?? DottedMap;
const map = new DottedMapCtor({ height: 100, grid: "diagonal" });

const svgMap = computed(() =>
  map.getSVG({
    radius: 0.22,
    color: props.mapColor,
    shape: "circle",
    backgroundColor: props.mapBgColor,
  }),
);

function projectPoint(lat: number, lng: number) {
  const x = (lng + 180) * (800 / 360);
  const y = (90 - lat) * (400 / 180);
  return { x, y };
}

function createCurvedPath(dot: Dot) {
  const start = projectPoint(dot.start.lat, dot.start.lng);
  const end = projectPoint(dot.end.lat, dot.end.lng);
  const midX = (start.x + end.x) / 2;
  const midY = Math.min(start.y, end.y) - 50;
  return `M ${start.x} ${start.y} Q ${midX} ${midY} ${end.x} ${end.y}`;
}
</script>

<template>
  <div style="position: relative; width: 100%; height: 100%; font-family: sans-serif; background: transparent;">
    <img
      :src="`data:image/svg+xml;utf8,${encodeURIComponent(svgMap)}`"
      style="pointer-events: none; width: 100%; height: 100%; user-select: none; mask-image: linear-gradient(to bottom, transparent, white 10%, white 90%, transparent); -webkit-mask-image: linear-gradient(to bottom, transparent, white 10%, white 90%, transparent); object-fit: contain;"
      alt="world map"
      draggable="false"
    />
    <svg
      viewBox="0 0 800 400"
      style="pointer-events: none; position: absolute; top: 0; right: 0; bottom: 0; left: 0; width: 100%; height: 100%; user-select: none;"
    >
      <g
        v-for="(dot, i) in props.dots"
        :key="`path-group-${i}`"
      >
        <path
          :key="`start-upper-${i}`"
          :d="createCurvedPath(dot)"
          fill="none"
          stroke="url(#path-gradient)"
          stroke-width="1"
          pathLength="1"
          stroke-dasharray="1"
          stroke-dashoffset="1"
        >
          <animate
            attributeName="stroke-dashoffset"
            from="1"
            to="0"
            dur="1.5s"
            :begin="`${0.5 * i}s`"
            fill="freeze"
          />
        </path>
      </g>

      <defs>
        <linearGradient
          id="path-gradient"
          x1="0%"
          y1="0%"
          x2="100%"
          y2="0%"
        >
          <stop
            offset="0%"
            stop-color="white"
            stop-opacity="0"
          />
          <stop
            offset="5%"
            :stop-color="lineColor"
            stop-opacity="1"
          />
          <stop
            offset="95%"
            :stop-color="lineColor"
            stop-opacity="1"
          />
          <stop
            offset="100%"
            stop-color="white"
            stop-opacity="0"
          />
        </linearGradient>
      </defs>

      <g
        v-for="(dot, i) in props.dots"
        :key="`points-group-${i}`"
      >
        <g :key="`start-${i}`">
          <circle
            :cx="projectPoint(dot.start.lat, dot.start.lng).x"
            :cy="projectPoint(dot.start.lat, dot.start.lng).y"
            r="2"
            :fill="props.lineColor"
          />
          <circle
            :cx="projectPoint(dot.start.lat, dot.start.lng).x"
            :cy="projectPoint(dot.start.lat, dot.start.lng).y"
            r="2"
            :fill="props.lineColor"
            opacity="0.5"
          >
            <animate
              attributeName="r"
              from="2"
              to="8"
              dur="1.5s"
              begin="0s"
              repeatCount="indefinite"
            />
            <animate
              attributeName="opacity"
              from="0.5"
              to="0"
              dur="1.5s"
              begin="0s"
              repeatCount="indefinite"
            />
          </circle>
        </g>
        <g :key="`end-${i}`">
          <circle
            :cx="projectPoint(dot.end.lat, dot.end.lng).x"
            :cy="projectPoint(dot.end.lat, dot.end.lng).y"
            r="2"
            :fill="props.lineColor"
          />
          <circle
            :cx="projectPoint(dot.end.lat, dot.end.lng).x"
            :cy="projectPoint(dot.end.lat, dot.end.lng).y"
            r="2"
            :fill="props.lineColor"
            opacity="0.5"
          >
            <animate
              attributeName="r"
              from="2"
              to="8"
              dur="1.5s"
              begin="0s"
              repeatCount="indefinite"
            />
            <animate
              attributeName="opacity"
              from="0.5"
              to="0"
              dur="1.5s"
              begin="0s"
              repeatCount="indefinite"
            />
          </circle>
        </g>
      </g>
    </svg>
  </div>
</template>
