export namespace ElectrApiType {
  export interface MenuItemSpec {
    id?: string;
    label?: string;
    type?: 'normal' | 'separator' | 'submenu' | 'checkbox' | 'radio';
    role?: string;
    accelerator?: string;
    enabled?: boolean;
    visible?: boolean;
    checked?: boolean;
    submenu?: MenuItemSpec[];
  }

  export interface MenuClickDetail {
    id: string;
    label: string;
    type: 'normal' | 'checkbox' | 'radio';
    checked: boolean;
  }

  export type WindowAction = 'MINI' | 'MAXI' | 'RSTR' | 'HIDE' | 'CLOSE' | 'KILL';

  export type Unsubscribe = () => void;

  export interface ElectronAPI {
    setMenu(template: MenuItemSpec[] | null): void;
    windowAction(act: WindowAction): void;
    setTitle(name: string): void;
    appReady(): void;
  }
}

declare global {
  interface Window {
    electronAPI: ElectrApiType.ElectronAPI;
  }

  interface DocumentEventMap {
    'APP-MENU-CLICK': CustomEvent<ElectrApiType.MenuClickDetail>;
    'WIN-STATE': CustomEvent<ELECTRON_APP_INFO_TYPE>;
  }
}