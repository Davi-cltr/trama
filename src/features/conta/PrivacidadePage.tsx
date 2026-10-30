import { Link } from 'react-router';

export function PrivacidadePage() {
  return (
    <main className="pagina" style={{ lineHeight: 1.55 }}>
      <Link to="/">‹ Voltar</Link>
      <h1 style={{ fontSize: 32 }}>Privacidade</h1>
      <p>
        O que vocês registram na Trama fala da saúde de uma criança. Pela lei (LGPD), são dados pessoais sensíveis.
        Por isso o cuidado é maior, e quem decide é a pessoa responsável pela criança.
      </p>

      <h2 style={{ fontSize: 22 }}>O que guardamos</h2>
      <ul>
        <li>O apelido da criança e, se vocês quiserem, o mês e o ano de nascimento. Nada de sobrenome, documento ou diagnóstico.</li>
        <li>O e-mail e o nome de quem entra, para saber quem é cada linha da trama.</li>
        <li>Os pontos: tipo, horário e o texto que cada pessoa escreveu.</li>
      </ul>

      <h2 style={{ fontSize: 22 }}>Quem vê</h2>
      <p>
        Só as pessoas convidadas para o caderno veem a trama. A responsável pode remover alguém a qualquer momento.
        Quem é removido deixa de ver na hora.
      </p>

      <h2 style={{ fontSize: 22 }}>O pôster</h2>
      <p>O pôster do mês mostra só a trama, o mês e quem tece. Nunca mostra o que foi escrito nem o tipo de cada ponto. Dá para esconder os nomes e o apelido.</p>

      <h2 style={{ fontSize: 22 }}>O resumo com inteligência artificial</h2>
      <p>
        Só acontece quando a responsável pede, e só depois de ela aceitar. O texto dos registros do período vai para um
        serviço de inteligência artificial, com os nomes trocados por papéis (“escola 1”) e o apelido trocado por “a criança”.
        O serviço não usa esses registros para treinar modelos. A permissão pode ser revogada em Sua conta.
      </p>

      <h2 style={{ fontSize: 22 }}>Seus direitos</h2>
      <ul>
        <li>A responsável pode baixar todos os dados do caderno em um arquivo, em Sua conta.</li>
        <li>A responsável pode apagar o caderno inteiro, para sempre.</li>
        <li>Qualquer pessoa pode sair de um caderno e apagar a própria conta.</li>
      </ul>

      <h2 style={{ fontSize: 22 }}>O que não fazemos</h2>
      <p>Não usamos ferramentas de análise de terceiros, não vendemos dados e não mostramos anúncios.</p>
    </main>
  );
}
