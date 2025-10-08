import { useEffect } from 'react';

export function useTitle(title: string = '', appName = 'Sonata') {
  useEffect(() => {
    document.title = title ? `${title} | ${appName}` : appName;
  }, [title, appName]);
}