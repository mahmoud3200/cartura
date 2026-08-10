import assert from "node:assert/strict";
import test from "node:test";

import {
  buildCloudinaryEditTransformation,
  toCloudinaryPixelCrop,
} from "./cloudinary-storage.js";

test("builds a full crop from source pixels instead of a one-pixel square", () => {
  assert.deepEqual(
    buildCloudinaryEditTransformation(
      1080,
      1080,
      { mode: "crop", crop: { x: 0, y: 0, width: 100, height: 100 } },
      { width: 736, height: 736 },
    ),
    [
      { angle: "auto" },
      { crop: "crop", x: 0, y: 0, width: 736, height: 736 },
      {
        crop: "fill",
        gravity: "center",
        width: 1080,
        height: 1080,
      },
    ],
  );
});

test("converts a full percentage crop to the full source dimensions", () => {
  assert.deepEqual(
    toCloudinaryPixelCrop(
      { x: 0, y: 0, width: 100, height: 100 },
      { width: 736, height: 736 },
    ),
    { x: 0, y: 0, width: 736, height: 736 },
  );
});

test("converts a partial percentage crop to fixed pixel coordinates", () => {
  assert.deepEqual(
    toCloudinaryPixelCrop(
      { x: 12.5, y: 25, width: 50, height: 50 },
      { width: 800, height: 600 },
    ),
    { x: 100, y: 150, width: 400, height: 300 },
  );
});

test("derives the crop size from rounded edges to stay within the source", () => {
  assert.deepEqual(
    toCloudinaryPixelCrop(
      { x: 33.3333, y: 0, width: 66.6667, height: 100 },
      { width: 736, height: 736 },
    ),
    { x: 245, y: 0, width: 491, height: 736 },
  );
});
