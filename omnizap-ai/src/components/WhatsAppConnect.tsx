import React, { useEffect } from 'react';
import {
  Smartphone,
  QrCode,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Loader2,
  Wifi,
  WifiOff,
  Trash2,
  AlertTriangle,
} from 'lucide-react';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { cn } from '../utils/cn';
import { useEvolutionAPI } from '../hooks/useEvolutionAPI';
import { useWhatsApp } from '../hooks/useWhatsApp';

interface Props {
  userId: string;
}

export function WhatsAppConnect({ userId }: Props) {
  const { connection, refetch } = useWhatsApp(userId);
  const { state, connect, disconnect, deleteConnection, refreshQR } = useEvolutionAPI(userId);

  // Sincroniza o status inicial com o banco
  useEffect(() => {
    if (connection?.status === 'connected') {
      // já conectado — não precisa mostrar QR
    }
  }, [connection]);

  const isAlreadyConnected = connection?.status === 'connected' && state.status === 'idle';
  const numero = connection?.numero || state.numero;

  const handleConnect = async () => {
    await connect();
    // Após conexão bem-sucedida, refetch o banco
    if (state.status === 'connected') refetch();
  };

  const handleDisconnect = async () => {
    await disconnect();
    refetch();
  };

  const handleDelete = async () => {
    await deleteConnection();
    refetch();
  };

  // ── Já conectado ────────────────────────────────────────────
  if (isAlreadyConnected || state.status === 'connected') {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4 p-6 bg-green-500/10 border border-green-500/20 rounded-[24px]">
          <div className="w-14 h-14 bg-green-500/20 rounded-2xl flex items-center justify-center">
            <CheckCircle2 className="w-7 h-7 text-green-500" />
          </div>
          <div className="flex-1">
            <p className="font-black text-green-400 uppercase tracking-tight text-sm">WhatsApp Conectado</p>
            <p className="text-xs text-dark-muted-foreground font-medium mt-1">
              {numero ? `Número: +${numero}` : 'Número ativo'}
            </p>
          </div>
          <Badge variant="success">Ativo</Badge>
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<WifiOff className="w-4 h-4" />}
            onClick={handleDisconnect}
            className="flex-1"
          >
            Desconectar
          </Button>
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<Trash2 className="w-4 h-4" />}
            onClick={handleDelete}
            className="text-destructive hover:text-destructive"
          >
            Remover Instância
          </Button>
        </div>
      </div>
    );
  }

  // ── Criando instância ───────────────────────────────────────
  if (state.status === 'creating') {
    return (
      <div className="flex flex-col items-center gap-4 py-10">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="text-sm font-black uppercase tracking-widest text-dark-muted-foreground">
          Criando sessão...
        </p>
      </div>
    );
  }

  // ── QR Code pronto para escanear ────────────────────────────
  if (state.status === 'qr_ready') {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3 p-4 bg-primary/5 border border-primary/20 rounded-2xl">
          <Loader2 className="w-5 h-5 text-primary animate-spin shrink-0" />
          <p className="text-xs font-medium text-dark-muted-foreground">
            Aguardando scan do QR Code...
          </p>
        </div>

        {/* QR Code */}
        <div className="flex justify-center">
          <div className="p-4 bg-white rounded-[24px] shadow-2xl shadow-primary/10">
            {state.qrCodeBase64 ? (
              <img
                src={state.qrCodeBase64}
                alt="QR Code WhatsApp"
                className="w-56 h-56 object-contain"
              />
            ) : (
              <div className="w-56 h-56 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
              </div>
            )}
          </div>
        </div>

        {/* Instruções */}
        <div className="space-y-3">
          {[
            'Abra o WhatsApp no seu celular',
            'Vá em Dispositivos conectados',
            'Toque em "Conectar dispositivo"',
            'Escaneie o QR Code acima',
          ].map((step, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-black flex items-center justify-center shrink-0">
                {i + 1}
              </div>
              <span className="text-xs font-medium text-dark-muted-foreground">{step}</span>
            </div>
          ))}
        </div>

        <Button
          variant="ghost"
          size="sm"
          leftIcon={<RefreshCw className="w-4 h-4" />}
          onClick={refreshQR}
          className="w-full"
        >
          Atualizar QR Code
        </Button>
      </div>
    );
  }

  // ── Erro ────────────────────────────────────────────────────
  if (state.status === 'error') {
    return (
      <div className="space-y-4">
        <div className="flex items-start gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-2xl">
          <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-black text-destructive uppercase tracking-tight">Erro na conexão</p>
            <p className="text-xs text-dark-muted-foreground font-medium mt-1">{state.error}</p>
          </div>
        </div>
        <Button onClick={handleConnect} className="w-full" leftIcon={<RefreshCw className="w-4 h-4" />}>
          Tentar Novamente
        </Button>
      </div>
    );
  }

  // ── Desconectado / inicial ──────────────────────────────────
  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center gap-6 py-6">
        <div className="w-20 h-20 rounded-[32px] bg-dark-muted border border-dark-border flex items-center justify-center">
          <QrCode className="w-10 h-10 text-dark-muted-foreground" />
        </div>
        <div className="text-center space-y-2">
          <p className="font-black text-lg uppercase tracking-tight">Conectar WhatsApp</p>
          <p className="text-xs text-dark-muted-foreground font-medium max-w-xs leading-relaxed">
            Conecte seu número via QR Code para ativar os agentes de IA no WhatsApp.
          </p>
        </div>
      </div>

      {connection?.status === 'disconnected' && (
        <div className="flex items-center gap-3 p-4 bg-dark-muted/30 border border-dark-border rounded-2xl">
          <WifiOff className="w-5 h-5 text-dark-muted-foreground shrink-0" />
          <div>
            <p className="text-xs font-black uppercase tracking-tight">Desconectado</p>
            {connection.numero && (
              <p className="text-xs text-dark-muted-foreground font-medium">
                Último número: +{connection.numero}
              </p>
            )}
          </div>
        </div>
      )}

      <Button
        onClick={handleConnect}
        className="w-full"
        leftIcon={<Smartphone className="w-4 h-4" />}
      >
        Gerar QR Code
      </Button>
    </div>
  );
}
