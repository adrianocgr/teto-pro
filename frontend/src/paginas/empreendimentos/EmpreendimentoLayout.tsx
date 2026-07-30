import { Link, Outlet, useParams } from 'react-router-dom';
import { useEmpreendimento } from '@/api/empreendimentos';
import { useDefinirEmpreendimentoAtual } from '@/componentes/ContextoEmpreendimentoAtual';
import { IconeSeta } from '@/componentes/Icones';

export function EmpreendimentoLayout() {
  const { id } = useParams<{ id: string }>();
  const empreendimentoId = Number(id);
  const { data: empreendimento, isLoading, isError } = useEmpreendimento(empreendimentoId);

  useDefinirEmpreendimentoAtual(empreendimento?.id, empreendimento?.descricao);

  if (isLoading) {
    return <p>Carregando…</p>;
  }

  if (isError || !empreendimento) {
    return (
      <div>
        <Link to="/empreendimentos" className="link-voltar">
          <IconeSeta /> Voltar para empreendimentos
        </Link>
        <div className="estado-vazio">
          <div className="titulo">Empreendimento não encontrado</div>
          <div className="subtitulo">Verifique se o link está correto ou volte para a lista.</div>
        </div>
      </div>
    );
  }

  const rotuloPartes = [
    empreendimento.matricula ? `Matrícula ${empreendimento.matricula}` : null,
    empreendimento.inscricaoMunicipal ? `IM ${empreendimento.inscricaoMunicipal}` : null,
  ].filter(Boolean);

  const enderecoPartes = [
    [empreendimento.endereco, empreendimento.numero].filter(Boolean).join(', '),
    empreendimento.complemento,
    empreendimento.quadra ? `Quadra ${empreendimento.quadra}` : null,
    empreendimento.lote ? `Lote ${empreendimento.lote}` : null,
  ].filter(Boolean);

  return (
    <div>
      <Link to="/empreendimentos" className="link-voltar">
        <IconeSeta /> Voltar para empreendimentos
      </Link>

      <div className="cabecalho-pagina">
        <div>
          {rotuloPartes.length > 0 && <div className="rotulo">{rotuloPartes.join(' · ')}</div>}
          <h1 className="titulo-pagina">{empreendimento.descricao}</h1>
          {enderecoPartes.length > 0 && <p className="subtitulo-pagina">{enderecoPartes.join(' · ')}</p>}
        </div>
      </div>

      <Outlet />
    </div>
  );
}
