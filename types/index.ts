// User interface matching backend User model
export interface User {
  id: string;
  email: string;
  full_name: string | null;
  is_active: boolean;
  created_at: string;
}

// Auth response from backend
export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

// Token payload
export interface TokenPayload {
  sub: string;
  exp: number;
}

export interface SipYearProjection {
  year: number;
  projected_value: number;
}

export type BasketType = "conservative" | "moderate" | "aggressive";

export interface FundRecommendation {
  scheme_code: string;
  scheme_name: string;
  category: string;
  basket_type: BasketType;
  returns_1y: number;
  returns_3y: number;
  returns_5y: number;
}

export interface RecommendationBasket {
  basket_type: BasketType;
  recommended: boolean;
  funds: FundRecommendation[];
}

export interface GoalRecommendations {
  goal_id: string;
  recommended_at: string;
  baskets: RecommendationBasket[];
}

export interface SipPlan {
  monthly_sip: number;
  total_invested: number;
  estimated_returns: number;
  year_by_year: SipYearProjection[];
}

export interface Concept {
  id: string;
  title: string;
  summary: string;
  explanation: string;
  number_example: string;
  created_at: string;
}
