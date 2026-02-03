import { CommandPalette } from './CommandPalette';
import { CommandPaletteProvider } from './CommandPaletteProvider';
import { useEffect } from 'react';
import { useCommandPaletteContext } from './CommandPaletteProvider';
import './index.css';

function CommandRegistrar() {
  const { registerPlugin } = useCommandPaletteContext();

  useEffect(() => {
    registerPlugin({
      name: 'Navigation',
      commands: [
        { id: 'nav-home', title: 'Go to Home', action: () => console.log('Home') },
        { id: 'nav-about', title: 'Go to About', action: () => console.log('About') },
      ],
    });
  }, [registerPlugin]);

  return null;
}

function App() {
  return (
    <CommandPaletteProvider>
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center text-zinc-900 dark:text-zinc-100 p-8">
        <h1 className="text-4xl font-bold mb-4 tracking-tight">Command Palette System</h1>
        <p className="text-zinc-500 mb-8 max-w-md text-center">
          A high-performance, accessible, and extensible command execution system.
        </p>
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-800">
          <p className="font-medium mb-4">Keyboard Shortcuts:</p>
          <ul className="space-y-2 text-sm">
            <li className="flex justify-between gap-8">
              <span className="text-zinc-500">Open Palette</span>
              <kbd className="px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded border border-zinc-300 dark:border-zinc-700">Ctrl + K</kbd>
            </li>
            <li className="flex justify-between gap-8">
              <span className="text-zinc-500">Dark Mode</span>
              <kbd className="px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded border border-zinc-300 dark:border-zinc-700">Ctrl + T</kbd>
            </li>
          </ul>
        </div>

        <CommandRegistrar />
        <CommandPalette />
      </div>
    </CommandPaletteProvider>
  );
}

export default App;
