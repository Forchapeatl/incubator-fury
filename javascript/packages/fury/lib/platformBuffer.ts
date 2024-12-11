/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import { hasBuffer } from "./util";

let utf8Encoder: TextEncoder | null;
let textDecoder: TextDecoder | null;

export type SupportedEncodings = "latin1" | "utf8";

export interface PlatformBuffer extends Uint8Array {
  toString(encoding?: SupportedEncodings, start?: number, end?: number): string;
  write(string: string, offset: number, encoding?: SupportedEncodings): void;
  copy(target: Uint8Array, targetStart?: number, sourceStart?: number, sourceEnd?: number): void;
}

export class BrowserBuffer extends Uint8Array implements PlatformBuffer {
  write(string: string, offset: number, encoding: SupportedEncodings = "utf8"): void {
    if (encoding === "latin1") {
      this.latin1Write(string, offset);
    } else {
      this.utf8Write(string, offset);
    }
  }

  toString(encoding: SupportedEncodings = "utf8", start = 0, end = this.length): string {
    if (encoding === "latin1") {
      return this.latin1Slice(start, end);
    }
    return this.utf8Slice(start, end);
  }

  static alloc(size: number): BrowserBuffer {
    return new BrowserBuffer(size);
  }

  latin1Write(string: string, offset: number): void {
    for (let index = 0; index < string.length; index++) {
      this[offset++] = string.charCodeAt(index);
    }
  }

  utf8Write(string: string, offset: number): void {
    const encoder = utf8Encoder || new TextEncoder();
    utf8Encoder = encoder; // Cache for reuse
    const encoded = encoder.encode(string);
    this.set(encoded, offset);
  }

  latin1Slice(start: number, end: number): string {
    return Array.from(this.subarray(start, end))
      .map(byte => String.fromCharCode(byte))
      .join("");
  }

  utf8Slice(start: number, end: number): string {
    if (!textDecoder) {
      textDecoder = new TextDecoder("utf-8");
    }
    return textDecoder.decode(this.subarray(start, end));
  }

  copy(target: Uint8Array, targetStart = 0, sourceStart = 0, sourceEnd = this.length): void {
    const subarray = this.subarray(sourceStart, sourceEnd);
    target.set(subarray, targetStart);
  }

  static byteLength(str: string): number {
    const encoder = utf8Encoder || new TextEncoder();
    utf8Encoder = encoder; // Cache for reuse
    return encoder.encode(str).length;
  }
}

export const fromUint8Array = hasBuffer
  ? (ab: Buffer | Uint8Array) => {
      if (!Buffer.isBuffer(ab)) {
        return Buffer.from(ab.buffer, ab.byteOffset, ab.byteLength) as unknown as PlatformBuffer;
      } else {
        return ab as unknown as PlatformBuffer;
      }
    }
  : (ab: Buffer | Uint8Array) => new BrowserBuffer(ab);

export const alloc = (hasBuffer ? Buffer.allocUnsafe : BrowserBuffer.alloc) as unknown as (size: number) => PlatformBuffer;

export const strByteLength = hasBuffer ? Buffer.byteLength : BrowserBuffer.byteLength;

export const fromString = hasBuffer
  ? (str: string) => Buffer.from(str) as unknown as PlatformBuffer
  : (str: string) => {
      const encoder = utf8Encoder || new TextEncoder();
      utf8Encoder = encoder; // Cache for reuse
      return new BrowserBuffer(encoder.encode(str));
    };
