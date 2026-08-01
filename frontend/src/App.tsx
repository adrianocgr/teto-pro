import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ProvedorAutenticacao, useAutenticacao } from './autenticacao/ContextoAutenticacao';
import { ProvedorToast } from './componentes/Toast';
import { ProvedorEmpreendimentoAtual } from './componentes/ContextoEmpreendimentoAtual';
import { AppShell } from './componentes/AppShell';

import { ListaEmpreendimentos } from './paginas/empreendimentos/ListaEmpreendimentos';
import { EmpreendimentoLayout } from './paginas/empreendimentos/EmpreendimentoLayout';
import { Resumo } from './paginas/empreendimentos/Resumo';
import { InvestidoresEmpreendimento } from './paginas/empreendimentos/InvestidoresEmpreendimento';
import { ListaDespesas } from './paginas/despesas/ListaDespesas';
import { DespesaDetalhe } from './paginas/despesas/DespesaDetalhe';
import { DespesasRecorrentes } from './paginas/despesas/DespesasRecorrentes';
import { Fechamento } from './paginas/fechamento/Fechamento';
import { ExtratoDespesas } from './paginas/relatorios/ExtratoDespesas';
import { Fornecedores } from './paginas/fornecedores/Fornecedores';
import { Categorias } from './paginas/categorias/Categorias';
import { Insumos } from './paginas/insumos/Insumos';
import { InvestidoresCatalogo } from './paginas/investidores/InvestidoresCatalogo';
import { Auditoria } from './paginas/auditoria/Auditoria';
import { Empresas } from './paginas/administracao/Empresas';
import { Usuarios } from './paginas/administracao/Usuarios';
import { Localidades } from './paginas/administracao/Localidades';

/** PLATAFORMA_ADMIN não pertence a nenhuma empresa — cai direto na área de
 * administração; os demais papéis seguem para a lista de empreendimentos. */
function RedirecionamentoInicial() {
  const { usuario } = useAutenticacao();
  const destino = usuario?.papel === 'PLATAFORMA_ADMIN' ? '/administracao/empresas' : '/empreendimentos';
  return <Navigate to={destino} replace />;
}

const clienteConsulta = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30_000,
    },
  },
});

export function App() {
  return (
    <QueryClientProvider client={clienteConsulta}>
      <ProvedorAutenticacao>
        <ProvedorToast>
          <ProvedorEmpreendimentoAtual>
            <BrowserRouter>
              <Routes>
                <Route element={<AppShell />}>
                  <Route path="/" element={<RedirecionamentoInicial />} />
                  <Route path="/administracao/empresas" element={<Empresas />} />
                  <Route path="/administracao/usuarios" element={<Usuarios />} />
                  <Route path="/administracao/localidades" element={<Localidades />} />
                  <Route path="/empreendimentos" element={<ListaEmpreendimentos />} />
                  <Route path="/empreendimentos/:id" element={<EmpreendimentoLayout />}>
                    <Route index element={<Navigate to="resumo" replace />} />
                    <Route path="resumo" element={<Resumo />} />
                    <Route path="despesas" element={<ListaDespesas />} />
                    <Route path="despesas/novo" element={<DespesaDetalhe />} />
                    <Route path="despesas/:despesaId" element={<DespesaDetalhe />} />
                    <Route path="despesas-recorrentes" element={<DespesasRecorrentes />} />
                    <Route path="investidores" element={<InvestidoresEmpreendimento />} />
                    <Route path="fechamento" element={<Fechamento />} />
                    <Route path="relatorios/extrato-despesas" element={<ExtratoDespesas />} />
                  </Route>
                  <Route path="/fornecedores" element={<Fornecedores />} />
                  <Route path="/categorias" element={<Categorias />} />
                  <Route path="/insumos" element={<Insumos />} />
                  <Route path="/investidores" element={<InvestidoresCatalogo />} />
                  <Route path="/auditoria" element={<Auditoria />} />
                </Route>
              </Routes>
            </BrowserRouter>
          </ProvedorEmpreendimentoAtual>
        </ProvedorToast>
      </ProvedorAutenticacao>
    </QueryClientProvider>
  );
}
