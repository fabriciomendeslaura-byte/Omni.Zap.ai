import React, { ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<Props, State> {
  public state: State;
  public props: Props;

  constructor(props: Props) {
    super(props);
    this.props = props;
    this.state = {
      hasError: false
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-muted flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white p-10 rounded-[40px] shadow-2xl border border-border text-center">
            <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-6 text-primary">
              <AlertCircle className="w-10 h-10" />
            </div>
            <h1 className="text-2xl font-black mb-4">Internal Error</h1>
            <p className="text-muted-foreground font-medium mb-8 leading-relaxed">
              Desculpe, ocorreu um erro inesperado na interface. Clique no botão abaixo para tentar novamente.
            </p>
            <div className="bg-muted p-4 rounded-2xl mb-8 text-left overflow-hidden">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Detalhes do Erro:</p>
              <code className="text-xs text-primary font-mono block truncate">
                {this.state.error?.message || 'Erro desconhecido'}
              </code>
            </div>
            <button 
              onClick={() => window.location.reload()}
              className="w-full bg-primary text-white py-5 rounded-2xl text-lg font-bold hover:bg-primary/90 transition-all shadow-xl shadow-primary/30 flex items-center justify-center gap-2 active:scale-95"
            >
              <RefreshCw className="w-5 h-5" />
              Recarregar App
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
