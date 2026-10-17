import assert from 'node:assert/strict';import {classifyNativeFailure} from './native-failure-class.mjs';
assert.equal(classifyNativeFailure('VideoFrameRatioError: test',1),'frame-ratio');
assert.equal(classifyNativeFailure('  throw new VideoFrameRatioError(PRIVATE_SENTINEL)\nError: other',1),'unexpected');
assert.equal(classifyNativeFailure('Error: Zu viele verworfene Videoframes: PRIVATE_SENTINEL',1),'frame-drops');
assert.equal(classifyNativeFailure('PRIVATE_SENTINEL',1),'unexpected');
assert.equal(classifyNativeFailure('PRIVATE_SENTINEL',0),'none');
console.log('Native failure class: only fixed labels survive; source snippets and private errors refused.');
