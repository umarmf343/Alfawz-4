declare module "react-native" {
  export type AppStateStatus = "active" | "background" | "inactive" | "unknown" | "extension"

  export interface AppStateStatic {
    currentState: AppStateStatus
    addEventListener(type: "change", listener: (state: AppStateStatus) => void): { remove(): void }
  }

  export const AppState: AppStateStatic

  export interface PlatformStatic {
    OS: "ios" | "android" | "web" | "macos" | "windows" | "native"
    select<T>(spec: { [platform: string]: T }): T
  }

  export const Platform: PlatformStatic
}
