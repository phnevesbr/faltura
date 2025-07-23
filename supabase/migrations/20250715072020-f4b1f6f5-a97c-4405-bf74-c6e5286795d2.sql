-- Criar função para buscar posição do usuário no ranking
CREATE OR REPLACE FUNCTION public.get_user_rank(target_user_id uuid)
RETURNS integer
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT rank_position::integer
  FROM (
    SELECT 
      user_id,
      ROW_NUMBER() OVER (ORDER BY total_experience DESC) as rank_position
    FROM public.user_levels
  ) ranked_users
  WHERE user_id = target_user_id;
$$;