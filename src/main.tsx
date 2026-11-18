import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// إلغاء إمكانية تغيير الأرقام في حقول الإدخال عبر عجلة التمرير في الفأرة (Disable number change on mouse wheel)
document.addEventListener(
  'wheel',
  (event) => {
    const activeEl = document.activeElement;
    if (activeEl instanceof HTMLInputElement && activeEl.type === 'number') {
      activeEl.blur();
    }
    const target = event.target;
    if (target instanceof HTMLInputElement && target.type === 'number') {
      target.blur();
    }
  },
  { capture: true, passive: true }
);

createRoot(document.getElementById('root')!).render(<App />);
