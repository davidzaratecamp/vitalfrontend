import { Component, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { TriangleAlert } from 'lucide-react'

interface Props {
  children: ReactNode
}
interface State {
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: unknown) {
    console.error('Error de interfaz:', error, info)
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 p-8 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-destructive/10">
          <TriangleAlert className="size-6 text-destructive" />
        </div>
        <h2 className="text-lg font-semibold">Algo falló al mostrar esta pantalla</h2>
        <p className="max-w-md text-sm text-muted-foreground">
          Puedes recargar la página. Si el problema persiste, comparte este mensaje con el equipo de
          desarrollo:
        </p>
        <pre className="max-w-full overflow-x-auto rounded-md bg-muted p-3 text-left text-xs text-muted-foreground">
          {this.state.error.message}
        </pre>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => this.setState({ error: null })}>
            Reintentar
          </Button>
          <Button onClick={() => window.location.reload()}>Recargar página</Button>
        </div>
      </div>
    )
  }
}
