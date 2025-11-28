/// <reference types="@raycast/api">

/* 🚧 🚧 🚧
 * This file is auto-generated from the extension's manifest.
 * Do not modify manually. Instead, update the `package.json` file.
 * 🚧 🚧 🚧 */

/* eslint-disable @typescript-eslint/ban-types */

type ExtensionPreferences = {
  /** API Key - Your Checker API key */
  "apiKey": string,
  /** API URL - Checker API URL */
  "apiUrl": string
}

/** Preferences accessible in all the extension's commands */
declare type Preferences = ExtensionPreferences

declare namespace Preferences {
  /** Preferences accessible in the `quick-checkin` command */
  export type QuickCheckin = ExtensionPreferences & {}
  /** Preferences accessible in the `list-boards` command */
  export type ListBoards = ExtensionPreferences & {}
  /** Preferences accessible in the `today-status` command */
  export type TodayStatus = ExtensionPreferences & {}
}

declare namespace Arguments {
  /** Arguments passed to the `quick-checkin` command */
  export type QuickCheckin = {}
  /** Arguments passed to the `list-boards` command */
  export type ListBoards = {}
  /** Arguments passed to the `today-status` command */
  export type TodayStatus = {}
}

