import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import NProgress from 'nprogress';
import 'nprogress/nprogress.css';

// Simple route-change loader. Shows spinner briefly whenever pathname changes.
NProgress.configure({ showSpinner: false, trickleSpeed: 100 });

export default function RouteLoader({ delay = 400 }) {
    const location = useLocation();

  useEffect(() => {
    NProgress.start();
    const id = setTimeout(() => NProgress.done(), delay);
    return () => {
      clearTimeout(id);
      NProgress.done();
    };
  }, [location.pathname, delay]);

  return null;
}
