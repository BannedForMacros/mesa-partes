import FormularioLoginAdmin from '../../../../components/forms/FormularioLoginAdmin'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-700 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Mesa de Partes Virtual</CardTitle>
          <CardDescription>Panel de Administración</CardDescription>
        </CardHeader>
        <CardContent>
          <FormularioLoginAdmin />
        </CardContent>
      </Card>
    </div>
  )
}