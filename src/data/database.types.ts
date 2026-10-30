
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "graphql_public": {
          Tables: {
            [_ in never]: never
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "graphql":
{ Args: { "extensions"?: Json,"operationName"?: string,"query"?: string,"variables"?: Json }; Returns: Json
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        },"public": {
          Tables: {
            "cadernos": {
                  Row: {
                    "apelido": string,"criado_em": string,"dona_id": string,"fuso": string,"id": string,"nascimento": string | null,"tratamento": string
                  }
                  ComputedFields: never
                  Insert: {
                    "apelido": string,"criado_em"?: string,"dona_id": string,"fuso"?: string,"id"?: string,"nascimento"?: string | null,"tratamento"?: string
                  }
                  Update: {
                    "apelido"?: string,"criado_em"?: string,"dona_id"?: string,"fuso"?: string,"id"?: string,"nascimento"?: string | null,"tratamento"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "cadernos_dona_id_fkey"
      columns: ["dona_id"]
isOneToOne: false
      referencedRelation: "perfis"
      referencedColumns: ["id"]
    }
                  ]
                },"consentimentos_ia": {
                  Row: {
                    "aceito_em": string | null,"caderno_id": string,"revogado_em": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "aceito_em"?: string | null,"caderno_id": string,"revogado_em"?: string | null
                  }
                  Update: {
                    "aceito_em"?: string | null,"caderno_id"?: string,"revogado_em"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "consentimentos_ia_caderno_id_fkey"
      columns: ["caderno_id"]
isOneToOne: true
      referencedRelation: "cadernos"
      referencedColumns: ["id"]
    }
                  ]
                },"convites": {
                  Row: {
                    "caderno_id": string,"cancelado_em": string | null,"criado_em": string,"expira_em": string,"id": string,"papel": string,"rotulo": string,"token_hash": string,"usado_em": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "caderno_id": string,"cancelado_em"?: string | null,"criado_em"?: string,"expira_em"?: string,"id"?: string,"papel": string,"rotulo": string,"token_hash": string,"usado_em"?: string | null
                  }
                  Update: {
                    "caderno_id"?: string,"cancelado_em"?: string | null,"criado_em"?: string,"expira_em"?: string,"id"?: string,"papel"?: string,"rotulo"?: string,"token_hash"?: string,"usado_em"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "convites_caderno_id_fkey"
      columns: ["caderno_id"]
isOneToOne: false
      referencedRelation: "cadernos"
      referencedColumns: ["id"]
    }
                  ]
                },"membros": {
                  Row: {
                    "ativo": boolean,"caderno_id": string,"cor": number,"entrou_em": string,"id": string,"papel": string,"perfil_id": string | null,"rotulo": string
                  }
                  ComputedFields: never
                  Insert: {
                    "ativo"?: boolean,"caderno_id": string,"cor": number,"entrou_em"?: string,"id"?: string,"papel": string,"perfil_id"?: string | null,"rotulo": string
                  }
                  Update: {
                    "ativo"?: boolean,"caderno_id"?: string,"cor"?: number,"entrou_em"?: string,"id"?: string,"papel"?: string,"perfil_id"?: string | null,"rotulo"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "membros_caderno_id_fkey"
      columns: ["caderno_id"]
isOneToOne: false
      referencedRelation: "cadernos"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "membros_perfil_id_fkey"
      columns: ["perfil_id"]
isOneToOne: false
      referencedRelation: "perfis"
      referencedColumns: ["id"]
    }
                  ]
                },"perfis": {
                  Row: {
                    "criado_em": string,"id": string,"nome_exibicao": string
                  }
                  ComputedFields: never
                  Insert: {
                    "criado_em"?: string,"id": string,"nome_exibicao": string
                  }
                  Update: {
                    "criado_em"?: string,"id"?: string,"nome_exibicao"?: string
                  }
                  Relationships: [
                    
                  ]
                },"pontos": {
                  Row: {
                    "caderno_id": string,"criado_em": string,"editado_em": string | null,"id": string,"membro_id": string,"ocorreu_em": string,"sono_ruim": boolean | null,"texto": string | null,"tipo": string
                  }
                  ComputedFields: never
                  Insert: {
                    "caderno_id": string,"criado_em"?: string,"editado_em"?: string | null,"id"?: string,"membro_id": string,"ocorreu_em": string,"sono_ruim"?: boolean | null,"texto"?: string | null,"tipo": string
                  }
                  Update: {
                    "caderno_id"?: string,"criado_em"?: string,"editado_em"?: string | null,"id"?: string,"membro_id"?: string,"ocorreu_em"?: string,"sono_ruim"?: boolean | null,"texto"?: string | null,"tipo"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "pontos_caderno_id_fkey"
      columns: ["caderno_id"]
isOneToOne: false
      referencedRelation: "cadernos"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "pontos_membro_id_fkey"
      columns: ["membro_id"]
isOneToOne: false
      referencedRelation: "membros"
      referencedColumns: ["id"]
    }
                  ]
                },"resumos_gerados": {
                  Row: {
                    "caderno_id": string,"criado_em": string,"id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "caderno_id": string,"criado_em"?: string,"id"?: string
                  }
                  Update: {
                    "caderno_id"?: string,"criado_em"?: string,"id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "resumos_gerados_caderno_id_fkey"
      columns: ["caderno_id"]
isOneToOne: false
      referencedRelation: "cadernos"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "aceitar_convite":
{ Args: { "p_token": string }; Returns: string
                           },
"apagar_minha_conta":
{ Args: Record<PropertyKey, never>; Returns: undefined
                           },
"criar_caderno":
{ Args: { "p_apelido": string,"p_nascimento": string,"p_rotulo": string,"p_tratamento": string }; Returns: string
                           },
"sou_dona":
{ Args: { "p_caderno": string }; Returns: boolean
                           },
"sou_membro":
{ Args: { "p_caderno": string }; Returns: boolean
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "graphql_public": {
          Enums: {
            
          }
        },"public": {
          Enums: {
            
          }
        }
} as const
