-- ─────────────────────────────────────────────────────────────
-- Dados iniciais para desenvolvimento local (supabase db reset)
-- Não contém dados de clientes reais.
-- ─────────────────────────────────────────────────────────────

insert into exercises (name, category, muscle_group, equipment, difficulty, instructions, common_mistakes, tips)
values
  ('Agachamento livre', 'força', 'pernas', 'barra', 'intermedio',
   'Pés à largura dos ombros, desce controlando o movimento até à paralela, mantém o peito elevado.',
   'Joelhos a colapsar para dentro; perder a curvatura lombar no fundo do movimento.',
   'Controla a descida durante 3 segundos e empurra o chão a subir.'),
  ('Supino inclinado com halteres', 'força', 'peito', 'halteres', 'intermedio',
   'Banco a 30-45°, desce os halteres até à altura do peito com cotovelos a 45° do tronco.',
   'Banco demasiado inclinado (vira ombro); arco lombar excessivo.',
   'Aperta o peito no topo do movimento durante 1 segundo.'),
  ('Chest press (máquina)', 'força', 'peito', 'máquina', 'iniciante',
   'Ajusta o banco para que a pega fique à altura do peito, empurra sem travar os cotovelos.',
   'Amplitude incompleta.',
   'Bom exercício para aprender o padrão de empurrar antes de progredir para livre.'),
  ('Aberturas com halteres', 'força', 'peito', 'halteres', 'iniciante',
   'Cotovelos ligeiramente flexionados, desce em arco até sentir alongamento no peito.',
   'Descer demasiado e sobrecarregar o ombro.',
   'Mantém sempre uma flexão ligeira e constante no cotovelo.'),
  ('Tríceps corda no cabo', 'força', 'tríceps', 'cabo', 'iniciante',
   'Cotovelos fixos junto ao tronco, estende totalmente e separa a corda no final.',
   'Usar os ombros para empurrar em vez do tríceps.',
   'Faz uma pausa de 1 segundo em extensão total.'),
  ('Tríceps francês', 'força', 'tríceps', 'halteres', 'intermedio',
   'Deitado ou sentado, desce o peso atrás da cabeça mantendo os cotovelos fixos.',
   'Deixar os cotovelos abrirem para os lados.',
   'Controla especialmente a fase excêntrica.'),
  ('Peso morto romeno', 'força', 'posteriores de coxa', 'barra', 'avancado',
   'Pernas quase esticadas, desce a barra junto às pernas mantendo a coluna neutra.',
   'Arredondar as costas; afastar a barra do corpo.',
   'Sente o alongamento nos isquiotibiais antes de inverter o movimento.'),
  ('Remada curvada', 'força', 'costas', 'barra', 'intermedio',
   'Tronco inclinado ~45°, puxa a barra em direção ao abdómen.',
   'Usar impulso das pernas/lombar para levantar o peso.',
   'Aperta as omoplatas no topo do movimento.')
on conflict do nothing;

insert into badges (code, name, description, icon)
values
  ('streak_7', 'Consistência — 7 dias', 'Completou treinos 7 dias seguidos.', 'flame'),
  ('streak_30', 'Consistência — 30 dias', 'Completou treinos 30 dias seguidos.', 'flame'),
  ('workouts_100', '100 Treinos', 'Completou 100 treinos na plataforma.', 'trophy'),
  ('personal_record', 'Novo Recorde Pessoal', 'Superou uma carga ou volume anterior num exercício.', 'sparkles'),
  ('checkin_streak_4', 'Check-in em Dia', '4 check-ins semanais consecutivos.', 'check-circle')
on conflict (code) do nothing;
