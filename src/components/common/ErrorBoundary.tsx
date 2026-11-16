import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Zap } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[F1 Hub Error Boundary caught error]:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.hash = 'home';
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#080808] text-white flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-gradient-to-br from-[#0c0c10] to-[#15151c] border border-red-600/40 rounded-2xl p-6 sm:p-8 text-center space-y-5 shadow-2xl shadow-red-950/40 glow-f1-red">
            <div className="w-14 h-14 rounded-2xl bg-red-950/60 border border-red-600/50 flex items-center justify-center mx-auto text-red-500 shadow-lg animate-pulse">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-red-500 flex items-center justify-center gap-1">
                <Zap className="w-3 h-3" />
                PIT WALL RECOVERY PROTOCOL
              </span>
              <h2 className="text-xl font-black uppercase tracking-tight text-white">
                Telemetry Display Glitch
              </h2>
              <p className="text-xs text-neutral-400 font-medium leading-relaxed">
                The session HUD caught an unexpected rendering event. Systems remain fully operational.
              </p>
            </div>

            <button
              onClick={this.handleReset}
              className="w-full py-3 px-4 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-red-600/40 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Reboot Timing HUD</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
