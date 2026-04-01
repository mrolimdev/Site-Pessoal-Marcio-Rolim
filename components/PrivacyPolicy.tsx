import React from 'react';
import ArrowLeftIcon from './icons/ArrowLeftIcon';

const PrivacyPolicy: React.FC = () => {
  return (
    <div className="min-h-screen bg-stone-50 text-slate-800 py-12 px-6">
      <div className="max-w-4xl mx-auto">
        <a 
          href="/" 
          className="inline-flex items-center gap-2 text-amber-600 hover:text-amber-700 font-medium mb-8 transition-colors"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Voltar para o início
        </a>

        <header className="mb-12 border-b border-stone-200 pb-8">
          <h1 className="text-4xl font-serif font-bold text-slate-900 mb-4">Política de Privacidade</h1>
          <p className="text-slate-500">Última atualização: 1º de Abril de 2026</p>
        </header>

        <section className="space-y-8 font-sans text-lg leading-relaxed">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">1. Introdução</h2>
            <p>
              Esta Política de Privacidade descreve como Marcio Rolim ("nós", "meu", "nosso") coleta, utiliza e protege suas informações pessoais quando você visita o site marciorolim.com.br e interage com nossos recursos, incluindo a Rolim IA (nosso assistente virtual).
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">2. Coleta de Dados</h2>
            <p className="mb-4">
              Coletamos informações que você nos fornece diretamente através de:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Interação com a Rolim IA:</strong> O conteúdo das mensagens trocadas com o assistente virtual para processamento e resposta em tempo real.</li>
              <li><strong>Comunicações via WhatsApp/E-mail:</strong> Quando você inicia um contato através dos links disponíveis no site.</li>
              <li><strong>Cookies e Dados de Navegação:</strong> Informações técnicas básicas (como endereço IP, tipo de navegador e tempo de permanência) coletadas automaticamente para melhoria da experiência do usuário.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">3. Uso dos Dados</h2>
            <p className="mb-4">
              Seus dados são utilizados exclusivamente para:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Responder às suas dúvidas e solicitações via Rolim IA.</li>
              <li>Fornecer orientações pastorais ou orçamentos de consultoria de tecnologia solicitados.</li>
              <li>Melhorar as funcionalidades técnicas e a segurança do site.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">4. Processamento via Terceiros (IA)</h2>
            <p>
              As mensagens enviadas à Rolim IA são processadas através da tecnologia Gemini do Google e/ou outros modelos de linguagem de grande porte. Seus dados de conversa são anônimos ou pseudo-anonimizados durante este processamento e não são vendidos a terceiros. Reúso de dados para treinamento de modelos segue as políticas de privacidade destas provedoras.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">5. Seus Direitos (LGPD)</h2>
            <p>
              De acordo com a Lei Geral de Proteção de Dados (LGP), você tem o direito de solicitar a confirmação da existência de tratamento, o acesso aos dados, a correção de dados incompletos ou inexatos e a exclusão dos seus dados tratados sob seu consentimento.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">6. Contato</h2>
            <p>
              Para qualquer dúvida sobre esta Política ou para exercer seus direitos, entre em contato via e-mail: <a href="mailto:contato@marciorolim.com.br" className="text-amber-600 hover:underline">contato@marciorolim.com.br</a>.
            </p>
          </div>
        </section>

        <footer className="mt-16 pt-8 border-t border-stone-200 text-center text-slate-400 text-sm">
          <p>© 2026 Marcio Rolim. Em conformidade com a LGPD brasileira.</p>
        </footer>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
