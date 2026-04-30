import { HookAPI } from 'antd/es/modal/useModal';
import { Subject } from 'rxjs';

type ModalEvent<K extends keyof HookAPI> = {
  type: K;
  params: Parameters<HookAPI[K]>[0];
};

export const modal$ = new Subject<ModalEvent<keyof HookAPI>>();

export const download = (data: Blob | Uint8Array, fileName: string) => {
  data = data instanceof Uint8Array ? new Blob([data as BlobPart]) : data;
  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(data);
    link.addEventListener('click', (e) => e.stopPropagation());
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};