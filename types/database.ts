export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      activities: {
        Row: {
          action: string
          created_at: string | null
          description: string | null
          entity_id: string | null
          entity_type: string
          id: string
          metadata: Json | null
          user_id: string | null
          workspace_id: string
        }
        Insert: {
          action: string
          created_at?: string | null
          description?: string | null
          entity_id?: string | null
          entity_type: string
          id?: string
          metadata?: Json | null
          user_id?: string | null
          workspace_id: string
        }
        Update: {
          action?: string
          created_at?: string | null
          description?: string | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          metadata?: Json | null
          user_id?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activities_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "user_workspaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      advisor_conversations: {
        Row: {
          created_at: string | null
          id: string
          last_message_at: string | null
          message_count: number
          title: string
          topic: string
          updated_at: string | null
          user_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          last_message_at?: string | null
          message_count?: number
          title?: string
          topic?: string
          updated_at?: string | null
          user_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          last_message_at?: string | null
          message_count?: number
          title?: string
          topic?: string
          updated_at?: string | null
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "advisor_conversations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "advisor_conversations_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "user_workspaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "advisor_conversations_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      advisor_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string | null
          id: string
          metadata: Json | null
          model: string | null
          role: string
          tokens_used: number | null
          topic: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          model?: string | null
          role?: string
          tokens_used?: number | null
          topic?: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          model?: string | null
          role?: string
          tokens_used?: number | null
          topic?: string
        }
        Relationships: [
          {
            foreignKeyName: "advisor_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "advisor_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      advisor_suggestions: {
        Row: {
          action_steps: Json | null
          conversation_id: string
          created_at: string | null
          description: string
          effort_score: number | null
          id: string
          impact_score: number | null
          priority: string
          rationale: string | null
          status: string
          title: string
          topic: string
          type: string
          workspace_id: string
        }
        Insert: {
          action_steps?: Json | null
          conversation_id: string
          created_at?: string | null
          description: string
          effort_score?: number | null
          id?: string
          impact_score?: number | null
          priority?: string
          rationale?: string | null
          status?: string
          title: string
          topic?: string
          type?: string
          workspace_id: string
        }
        Update: {
          action_steps?: Json | null
          conversation_id?: string
          created_at?: string | null
          description?: string
          effort_score?: number | null
          id?: string
          impact_score?: number | null
          priority?: string
          rationale?: string | null
          status?: string
          title?: string
          topic?: string
          type?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "advisor_suggestions_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "advisor_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "advisor_suggestions_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "user_workspaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "advisor_suggestions_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      analytics_conversions: {
        Row: {
          attribution_campaign: string | null
          attribution_medium: string | null
          attribution_source: string | null
          conversion_value: number
          converted_at: string
          goal_id: string
          id: string
          session_id: string | null
          visitor_id: string | null
          workspace_id: string
        }
        Insert: {
          attribution_campaign?: string | null
          attribution_medium?: string | null
          attribution_source?: string | null
          conversion_value?: number
          converted_at?: string
          goal_id: string
          id?: string
          session_id?: string | null
          visitor_id?: string | null
          workspace_id: string
        }
        Update: {
          attribution_campaign?: string | null
          attribution_medium?: string | null
          attribution_source?: string | null
          conversion_value?: number
          converted_at?: string
          goal_id?: string
          id?: string
          session_id?: string | null
          visitor_id?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "analytics_conversions_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "analytics_goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analytics_conversions_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "analytics_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analytics_conversions_visitor_id_fkey"
            columns: ["visitor_id"]
            isOneToOne: false
            referencedRelation: "analytics_visitors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analytics_conversions_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "user_workspaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analytics_conversions_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      analytics_events: {
        Row: {
          created_at: string
          event_category: string
          event_name: string
          event_value: number | null
          id: string
          page_path: string | null
          properties: Json | null
          session_id: string | null
          visitor_id: string | null
          workspace_id: string
        }
        Insert: {
          created_at?: string
          event_category?: string
          event_name: string
          event_value?: number | null
          id?: string
          page_path?: string | null
          properties?: Json | null
          session_id?: string | null
          visitor_id?: string | null
          workspace_id: string
        }
        Update: {
          created_at?: string
          event_category?: string
          event_name?: string
          event_value?: number | null
          id?: string
          page_path?: string | null
          properties?: Json | null
          session_id?: string | null
          visitor_id?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "analytics_events_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "analytics_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analytics_events_visitor_id_fkey"
            columns: ["visitor_id"]
            isOneToOne: false
            referencedRelation: "analytics_visitors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analytics_events_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "user_workspaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analytics_events_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      analytics_funnels: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          steps: Json
          updated_at: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          steps?: Json
          updated_at?: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          steps?: Json
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "analytics_funnels_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "user_workspaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analytics_funnels_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      analytics_goals: {
        Row: {
          conversion_value: number
          created_at: string
          description: string | null
          goal_type: string
          id: string
          is_active: boolean
          name: string
          target_operator: string
          target_value: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          conversion_value?: number
          created_at?: string
          description?: string | null
          goal_type: string
          id?: string
          is_active?: boolean
          name: string
          target_operator?: string
          target_value: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          conversion_value?: number
          created_at?: string
          description?: string | null
          goal_type?: string
          id?: string
          is_active?: boolean
          name?: string
          target_operator?: string
          target_value?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "analytics_goals_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "user_workspaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analytics_goals_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      analytics_page_views: {
        Row: {
          browser: string | null
          city: string | null
          country: string | null
          created_at: string
          device_type: string | null
          duration_seconds: number
          id: string
          is_exit: boolean
          os: string | null
          page_path: string
          page_title: string | null
          referrer: string | null
          scroll_depth: number
          session_id: string | null
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
          visitor_id: string | null
          workspace_id: string
        }
        Insert: {
          browser?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          device_type?: string | null
          duration_seconds?: number
          id?: string
          is_exit?: boolean
          os?: string | null
          page_path: string
          page_title?: string | null
          referrer?: string | null
          scroll_depth?: number
          session_id?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          visitor_id?: string | null
          workspace_id: string
        }
        Update: {
          browser?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          device_type?: string | null
          duration_seconds?: number
          id?: string
          is_exit?: boolean
          os?: string | null
          page_path?: string
          page_title?: string | null
          referrer?: string | null
          scroll_depth?: number
          session_id?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          visitor_id?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "analytics_page_views_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "analytics_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analytics_page_views_visitor_id_fkey"
            columns: ["visitor_id"]
            isOneToOne: false
            referencedRelation: "analytics_visitors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analytics_page_views_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "user_workspaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analytics_page_views_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      analytics_reports: {
        Row: {
          config: Json
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          name: string
          report_type: string
          schedule: Json | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          config?: Json
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name: string
          report_type?: string
          schedule?: Json | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          config?: Json
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name?: string
          report_type?: string
          schedule?: Json | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "analytics_reports_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analytics_reports_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "user_workspaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analytics_reports_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      analytics_sessions: {
        Row: {
          browser: string | null
          browser_version: string | null
          city: string | null
          conversion_value: number
          converted: boolean
          country: string | null
          created_at: string
          device_type: string | null
          duration_seconds: number
          ended_at: string | null
          entry_page: string
          exit_page: string | null
          id: string
          ip_hash: string | null
          is_bounce: boolean
          os: string | null
          os_version: string | null
          page_views: number
          referrer: string | null
          region: string | null
          screen_resolution: string | null
          started_at: string
          updated_at: string
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
          visitor_id: string | null
          workspace_id: string
        }
        Insert: {
          browser?: string | null
          browser_version?: string | null
          city?: string | null
          conversion_value?: number
          converted?: boolean
          country?: string | null
          created_at?: string
          device_type?: string | null
          duration_seconds?: number
          ended_at?: string | null
          entry_page: string
          exit_page?: string | null
          id?: string
          ip_hash?: string | null
          is_bounce?: boolean
          os?: string | null
          os_version?: string | null
          page_views?: number
          referrer?: string | null
          region?: string | null
          screen_resolution?: string | null
          started_at?: string
          updated_at?: string
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          visitor_id?: string | null
          workspace_id: string
        }
        Update: {
          browser?: string | null
          browser_version?: string | null
          city?: string | null
          conversion_value?: number
          converted?: boolean
          country?: string | null
          created_at?: string
          device_type?: string | null
          duration_seconds?: number
          ended_at?: string | null
          entry_page?: string
          exit_page?: string | null
          id?: string
          ip_hash?: string | null
          is_bounce?: boolean
          os?: string | null
          os_version?: string | null
          page_views?: number
          referrer?: string | null
          region?: string | null
          screen_resolution?: string | null
          started_at?: string
          updated_at?: string
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          visitor_id?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "analytics_sessions_visitor_id_fkey"
            columns: ["visitor_id"]
            isOneToOne: false
            referencedRelation: "analytics_visitors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analytics_sessions_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "user_workspaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analytics_sessions_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      analytics_visitors: {
        Row: {
          country: string | null
          created_at: string
          device_type: string | null
          first_seen: string
          id: string
          is_returning: boolean
          last_seen: string
          lifetime_value: number
          metadata: Json | null
          tags: string[] | null
          total_duration_seconds: number
          total_page_views: number
          total_sessions: number
          updated_at: string
          workspace_id: string
        }
        Insert: {
          country?: string | null
          created_at?: string
          device_type?: string | null
          first_seen?: string
          id?: string
          is_returning?: boolean
          last_seen?: string
          lifetime_value?: number
          metadata?: Json | null
          tags?: string[] | null
          total_duration_seconds?: number
          total_page_views?: number
          total_sessions?: number
          updated_at?: string
          workspace_id: string
        }
        Update: {
          country?: string | null
          created_at?: string
          device_type?: string | null
          first_seen?: string
          id?: string
          is_returning?: boolean
          last_seen?: string
          lifetime_value?: number
          metadata?: Json | null
          tags?: string[] | null
          total_duration_seconds?: number
          total_page_views?: number
          total_sessions?: number
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "analytics_visitors_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "user_workspaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analytics_visitors_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_actions: {
        Row: {
          action_config: Json
          action_type: Database["public"]["Enums"]["automation_action_type"]
          automation_id: string
          branch_condition: string | null
          created_at: string
          id: string
          parent_action_id: string | null
          position: number
          updated_at: string
        }
        Insert: {
          action_config?: Json
          action_type: Database["public"]["Enums"]["automation_action_type"]
          automation_id: string
          branch_condition?: string | null
          created_at?: string
          id?: string
          parent_action_id?: string | null
          position?: number
          updated_at?: string
        }
        Update: {
          action_config?: Json
          action_type?: Database["public"]["Enums"]["automation_action_type"]
          automation_id?: string
          branch_condition?: string | null
          created_at?: string
          id?: string
          parent_action_id?: string | null
          position?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "automation_actions_automation_id_fkey"
            columns: ["automation_id"]
            isOneToOne: false
            referencedRelation: "automations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automation_actions_parent_action_id_fkey"
            columns: ["parent_action_id"]
            isOneToOne: false
            referencedRelation: "automation_actions"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_run_logs: {
        Row: {
          action_id: string | null
          created_at: string
          details: Json | null
          id: string
          level: Database["public"]["Enums"]["automation_log_level"]
          message: string
          run_id: string
        }
        Insert: {
          action_id?: string | null
          created_at?: string
          details?: Json | null
          id?: string
          level?: Database["public"]["Enums"]["automation_log_level"]
          message: string
          run_id: string
        }
        Update: {
          action_id?: string | null
          created_at?: string
          details?: Json | null
          id?: string
          level?: Database["public"]["Enums"]["automation_log_level"]
          message?: string
          run_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "automation_run_logs_action_id_fkey"
            columns: ["action_id"]
            isOneToOne: false
            referencedRelation: "automation_actions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automation_run_logs_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "automation_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_runs: {
        Row: {
          actions_executed: number
          actions_failed: number
          automation_id: string
          completed_at: string | null
          created_at: string
          duration_ms: number | null
          error_message: string | null
          id: string
          started_at: string | null
          status: Database["public"]["Enums"]["automation_run_status"]
          trigger_data: Json
          trigger_type: Database["public"]["Enums"]["automation_trigger_type"]
          workspace_id: string
        }
        Insert: {
          actions_executed?: number
          actions_failed?: number
          automation_id: string
          completed_at?: string | null
          created_at?: string
          duration_ms?: number | null
          error_message?: string | null
          id?: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["automation_run_status"]
          trigger_data?: Json
          trigger_type: Database["public"]["Enums"]["automation_trigger_type"]
          workspace_id: string
        }
        Update: {
          actions_executed?: number
          actions_failed?: number
          automation_id?: string
          completed_at?: string | null
          created_at?: string
          duration_ms?: number | null
          error_message?: string | null
          id?: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["automation_run_status"]
          trigger_data?: Json
          trigger_type?: Database["public"]["Enums"]["automation_trigger_type"]
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "automation_runs_automation_id_fkey"
            columns: ["automation_id"]
            isOneToOne: false
            referencedRelation: "automations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automation_runs_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "user_workspaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automation_runs_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_schedules: {
        Row: {
          automation_id: string
          created_at: string
          cron_expression: string
          id: string
          last_run_at: string | null
          next_run_at: string | null
          timezone: string
          updated_at: string
        }
        Insert: {
          automation_id: string
          created_at?: string
          cron_expression: string
          id?: string
          last_run_at?: string | null
          next_run_at?: string | null
          timezone?: string
          updated_at?: string
        }
        Update: {
          automation_id?: string
          created_at?: string
          cron_expression?: string
          id?: string
          last_run_at?: string | null
          next_run_at?: string | null
          timezone?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "automation_schedules_automation_id_fkey"
            columns: ["automation_id"]
            isOneToOne: true
            referencedRelation: "automations"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_webhooks: {
        Row: {
          allowed_ips: string[] | null
          automation_id: string
          created_at: string
          id: string
          last_triggered_at: string | null
          require_signature: boolean
          secret_key: string
          trigger_count: number
          webhook_key: string
          workspace_id: string
        }
        Insert: {
          allowed_ips?: string[] | null
          automation_id: string
          created_at?: string
          id?: string
          last_triggered_at?: string | null
          require_signature?: boolean
          secret_key?: string
          trigger_count?: number
          webhook_key?: string
          workspace_id: string
        }
        Update: {
          allowed_ips?: string[] | null
          automation_id?: string
          created_at?: string
          id?: string
          last_triggered_at?: string | null
          require_signature?: boolean
          secret_key?: string
          trigger_count?: number
          webhook_key?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "automation_webhooks_automation_id_fkey"
            columns: ["automation_id"]
            isOneToOne: true
            referencedRelation: "automations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automation_webhooks_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "user_workspaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automation_webhooks_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      automations: {
        Row: {
          cooldown_seconds: number | null
          created_at: string
          created_by: string | null
          description: string | null
          filter_conditions: Json | null
          id: string
          last_run_at: string | null
          name: string
          run_count: number
          run_limit: number | null
          status: Database["public"]["Enums"]["automation_status"]
          trigger_config: Json
          trigger_type: Database["public"]["Enums"]["automation_trigger_type"]
          updated_at: string
          workspace_id: string
        }
        Insert: {
          cooldown_seconds?: number | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          filter_conditions?: Json | null
          id?: string
          last_run_at?: string | null
          name: string
          run_count?: number
          run_limit?: number | null
          status?: Database["public"]["Enums"]["automation_status"]
          trigger_config?: Json
          trigger_type: Database["public"]["Enums"]["automation_trigger_type"]
          updated_at?: string
          workspace_id: string
        }
        Update: {
          cooldown_seconds?: number | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          filter_conditions?: Json | null
          id?: string
          last_run_at?: string | null
          name?: string
          run_count?: number
          run_limit?: number | null
          status?: Database["public"]["Enums"]["automation_status"]
          trigger_config?: Json
          trigger_type?: Database["public"]["Enums"]["automation_trigger_type"]
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "automations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automations_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "user_workspaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automations_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts: {
        Row: {
          avatar_url: string | null
          company: string | null
          created_at: string | null
          custom_fields: Json | null
          email: string
          external_id: string | null
          id: string
          job_title: string | null
          last_contacted_at: string | null
          last_seen_at: string | null
          lists: string[] | null
          metadata: Json | null
          name: string | null
          phone: string | null
          source: Database["public"]["Enums"]["contact_source"] | null
          source_id: string | null
          source_url: string | null
          status: Database["public"]["Enums"]["contact_status"] | null
          stripe_customer_id: string | null
          tags: string[] | null
          total_emails_clicked: number | null
          total_emails_opened: number | null
          total_emails_sent: number | null
          total_visits: number | null
          updated_at: string | null
          workspace_id: string
        }
        Insert: {
          avatar_url?: string | null
          company?: string | null
          created_at?: string | null
          custom_fields?: Json | null
          email: string
          external_id?: string | null
          id?: string
          job_title?: string | null
          last_contacted_at?: string | null
          last_seen_at?: string | null
          lists?: string[] | null
          metadata?: Json | null
          name?: string | null
          phone?: string | null
          source?: Database["public"]["Enums"]["contact_source"] | null
          source_id?: string | null
          source_url?: string | null
          status?: Database["public"]["Enums"]["contact_status"] | null
          stripe_customer_id?: string | null
          tags?: string[] | null
          total_emails_clicked?: number | null
          total_emails_opened?: number | null
          total_emails_sent?: number | null
          total_visits?: number | null
          updated_at?: string | null
          workspace_id: string
        }
        Update: {
          avatar_url?: string | null
          company?: string | null
          created_at?: string | null
          custom_fields?: Json | null
          email?: string
          external_id?: string | null
          id?: string
          job_title?: string | null
          last_contacted_at?: string | null
          last_seen_at?: string | null
          lists?: string[] | null
          metadata?: Json | null
          name?: string | null
          phone?: string | null
          source?: Database["public"]["Enums"]["contact_source"] | null
          source_id?: string | null
          source_url?: string | null
          status?: Database["public"]["Enums"]["contact_status"] | null
          stripe_customer_id?: string | null
          tags?: string[] | null
          total_emails_clicked?: number | null
          total_emails_opened?: number | null
          total_emails_sent?: number | null
          total_visits?: number | null
          updated_at?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contacts_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "user_workspaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contacts_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      content_engagement: {
        Row: {
          comments: number | null
          created_at: string | null
          id: string
          likes: number | null
          post_id: string
          shares: number | null
          updated_at: string | null
          views: number | null
        }
        Insert: {
          comments?: number | null
          created_at?: string | null
          id?: string
          likes?: number | null
          post_id: string
          shares?: number | null
          updated_at?: string | null
          views?: number | null
        }
        Update: {
          comments?: number | null
          created_at?: string | null
          id?: string
          likes?: number | null
          post_id?: string
          shares?: number | null
          updated_at?: string | null
          views?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "content_engagement_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: true
            referencedRelation: "content_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      content_posts: {
        Row: {
          ai_generated: boolean | null
          category: string | null
          content: string
          content_type: string | null
          created_at: string | null
          id: string
          media_urls: string[] | null
          meta_description: string | null
          metadata: Json | null
          platforms: Database["public"]["Enums"]["post_platform"][] | null
          published_at: string | null
          scheduled_at: string | null
          slug: string | null
          status: Database["public"]["Enums"]["post_status"] | null
          tags: string[] | null
          title: string | null
          updated_at: string | null
          user_id: string
          workspace_id: string
        }
        Insert: {
          ai_generated?: boolean | null
          category?: string | null
          content: string
          content_type?: string | null
          created_at?: string | null
          id?: string
          media_urls?: string[] | null
          meta_description?: string | null
          metadata?: Json | null
          platforms?: Database["public"]["Enums"]["post_platform"][] | null
          published_at?: string | null
          scheduled_at?: string | null
          slug?: string | null
          status?: Database["public"]["Enums"]["post_status"] | null
          tags?: string[] | null
          title?: string | null
          updated_at?: string | null
          user_id: string
          workspace_id: string
        }
        Update: {
          ai_generated?: boolean | null
          category?: string | null
          content?: string
          content_type?: string | null
          created_at?: string | null
          id?: string
          media_urls?: string[] | null
          meta_description?: string | null
          metadata?: Json | null
          platforms?: Database["public"]["Enums"]["post_platform"][] | null
          published_at?: string | null
          scheduled_at?: string | null
          slug?: string | null
          status?: Database["public"]["Enums"]["post_status"] | null
          tags?: string[] | null
          title?: string | null
          updated_at?: string | null
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_posts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_posts_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "user_workspaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_posts_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      "content-media": {
        Row: {
          created_at: string
          id: number
        }
        Insert: {
          created_at?: string
          id?: number
        }
        Update: {
          created_at?: string
          id?: number
        }
        Relationships: []
      }
      customers: {
        Row: {
          canceled_at: string | null
          churn_risk_score: number | null
          company: string | null
          created_at: string | null
          currency: string | null
          days_until_renewal: number | null
          email: string
          failed_payment_count: number | null
          id: string
          last_invoice_date: string | null
          last_payment_date: string | null
          lifetime_value: number | null
          metadata: Json | null
          mrr: number | null
          name: string | null
          payment_count: number | null
          plan_id: string | null
          plan_name: string | null
          status: Database["public"]["Enums"]["customer_status"] | null
          stripe_customer_id: string
          stripe_subscription_id: string | null
          subscription_end_date: string | null
          subscription_start_date: string | null
          subscription_status:
            | Database["public"]["Enums"]["subscription_status"]
            | null
          synced_at: string | null
          trial_end_date: string | null
          updated_at: string | null
          workspace_id: string
        }
        Insert: {
          canceled_at?: string | null
          churn_risk_score?: number | null
          company?: string | null
          created_at?: string | null
          currency?: string | null
          days_until_renewal?: number | null
          email: string
          failed_payment_count?: number | null
          id?: string
          last_invoice_date?: string | null
          last_payment_date?: string | null
          lifetime_value?: number | null
          metadata?: Json | null
          mrr?: number | null
          name?: string | null
          payment_count?: number | null
          plan_id?: string | null
          plan_name?: string | null
          status?: Database["public"]["Enums"]["customer_status"] | null
          stripe_customer_id: string
          stripe_subscription_id?: string | null
          subscription_end_date?: string | null
          subscription_start_date?: string | null
          subscription_status?:
            | Database["public"]["Enums"]["subscription_status"]
            | null
          synced_at?: string | null
          trial_end_date?: string | null
          updated_at?: string | null
          workspace_id: string
        }
        Update: {
          canceled_at?: string | null
          churn_risk_score?: number | null
          company?: string | null
          created_at?: string | null
          currency?: string | null
          days_until_renewal?: number | null
          email?: string
          failed_payment_count?: number | null
          id?: string
          last_invoice_date?: string | null
          last_payment_date?: string | null
          lifetime_value?: number | null
          metadata?: Json | null
          mrr?: number | null
          name?: string | null
          payment_count?: number | null
          plan_id?: string | null
          plan_name?: string | null
          status?: Database["public"]["Enums"]["customer_status"] | null
          stripe_customer_id?: string
          stripe_subscription_id?: string | null
          subscription_end_date?: string | null
          subscription_start_date?: string | null
          subscription_status?:
            | Database["public"]["Enums"]["subscription_status"]
            | null
          synced_at?: string | null
          trial_end_date?: string | null
          updated_at?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "customers_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "user_workspaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customers_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      deal_activities: {
        Row: {
          activity_type: Database["public"]["Enums"]["deal_activity_type"]
          completed_at: string | null
          created_at: string | null
          deal_id: string
          description: string | null
          from_stage_id: string | null
          id: string
          is_completed: boolean | null
          metadata: Json | null
          new_value: number | null
          old_value: number | null
          scheduled_at: string | null
          title: string | null
          to_stage_id: string | null
          user_id: string
          workspace_id: string
        }
        Insert: {
          activity_type: Database["public"]["Enums"]["deal_activity_type"]
          completed_at?: string | null
          created_at?: string | null
          deal_id: string
          description?: string | null
          from_stage_id?: string | null
          id?: string
          is_completed?: boolean | null
          metadata?: Json | null
          new_value?: number | null
          old_value?: number | null
          scheduled_at?: string | null
          title?: string | null
          to_stage_id?: string | null
          user_id: string
          workspace_id: string
        }
        Update: {
          activity_type?: Database["public"]["Enums"]["deal_activity_type"]
          completed_at?: string | null
          created_at?: string | null
          deal_id?: string
          description?: string | null
          from_stage_id?: string | null
          id?: string
          is_completed?: boolean | null
          metadata?: Json | null
          new_value?: number | null
          old_value?: number | null
          scheduled_at?: string | null
          title?: string | null
          to_stage_id?: string | null
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "deal_activities_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deal_activities_from_stage_id_fkey"
            columns: ["from_stage_id"]
            isOneToOne: false
            referencedRelation: "pipeline_stages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deal_activities_to_stage_id_fkey"
            columns: ["to_stage_id"]
            isOneToOne: false
            referencedRelation: "pipeline_stages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deal_activities_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deal_activities_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "user_workspaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deal_activities_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      deals: {
        Row: {
          actual_close_date: string | null
          company: string | null
          contact_id: string | null
          created_at: string | null
          currency: string | null
          description: string | null
          expected_close_date: string | null
          id: string
          lost_reason: string | null
          metadata: Json | null
          name: string
          owner_id: string | null
          position: number | null
          probability: number | null
          stage_id: string | null
          status: Database["public"]["Enums"]["deal_status"] | null
          tags: string[] | null
          updated_at: string | null
          value: number | null
          workspace_id: string
        }
        Insert: {
          actual_close_date?: string | null
          company?: string | null
          contact_id?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          expected_close_date?: string | null
          id?: string
          lost_reason?: string | null
          metadata?: Json | null
          name: string
          owner_id?: string | null
          position?: number | null
          probability?: number | null
          stage_id?: string | null
          status?: Database["public"]["Enums"]["deal_status"] | null
          tags?: string[] | null
          updated_at?: string | null
          value?: number | null
          workspace_id: string
        }
        Update: {
          actual_close_date?: string | null
          company?: string | null
          contact_id?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          expected_close_date?: string | null
          id?: string
          lost_reason?: string | null
          metadata?: Json | null
          name?: string
          owner_id?: string | null
          position?: number | null
          probability?: number | null
          stage_id?: string | null
          status?: Database["public"]["Enums"]["deal_status"] | null
          tags?: string[] | null
          updated_at?: string | null
          value?: number | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "deals_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "pipeline_stages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "user_workspaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback_submissions: {
        Row: {
          assigned_to: string | null
          attachment_urls: string[] | null
          contact_id: string | null
          content: string
          created_at: string | null
          email: string | null
          emoji_rating: string | null
          id: string
          internal_notes: string | null
          ip_address: unknown
          metadata: Json | null
          name: string | null
          page_url: string | null
          priority: Database["public"]["Enums"]["task_priority"] | null
          rating: number | null
          resolved_at: string | null
          screen_size: string | null
          status: string | null
          title: string | null
          type: string | null
          updated_at: string | null
          user_agent: string | null
          votes: number | null
          widget_id: string
          workspace_id: string
        }
        Insert: {
          assigned_to?: string | null
          attachment_urls?: string[] | null
          contact_id?: string | null
          content: string
          created_at?: string | null
          email?: string | null
          emoji_rating?: string | null
          id?: string
          internal_notes?: string | null
          ip_address?: unknown
          metadata?: Json | null
          name?: string | null
          page_url?: string | null
          priority?: Database["public"]["Enums"]["task_priority"] | null
          rating?: number | null
          resolved_at?: string | null
          screen_size?: string | null
          status?: string | null
          title?: string | null
          type?: string | null
          updated_at?: string | null
          user_agent?: string | null
          votes?: number | null
          widget_id: string
          workspace_id: string
        }
        Update: {
          assigned_to?: string | null
          attachment_urls?: string[] | null
          contact_id?: string | null
          content?: string
          created_at?: string | null
          email?: string | null
          emoji_rating?: string | null
          id?: string
          internal_notes?: string | null
          ip_address?: unknown
          metadata?: Json | null
          name?: string | null
          page_url?: string | null
          priority?: Database["public"]["Enums"]["task_priority"] | null
          rating?: number | null
          resolved_at?: string | null
          screen_size?: string | null
          status?: string | null
          title?: string | null
          type?: string | null
          updated_at?: string | null
          user_agent?: string | null
          votes?: number | null
          widget_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feedback_submissions_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feedback_submissions_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feedback_submissions_widget_id_fkey"
            columns: ["widget_id"]
            isOneToOne: false
            referencedRelation: "feedback_widgets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feedback_submissions_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "user_workspaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feedback_submissions_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback_widgets: {
        Row: {
          allow_attachments: boolean | null
          categories: string[] | null
          created_at: string | null
          description: string | null
          domains: string[] | null
          id: string
          is_active: boolean | null
          name: string
          placeholder: string | null
          position: string | null
          primary_color: string | null
          require_email: boolean | null
          settings: Json | null
          show_emoji_rating: boolean | null
          slug: string | null
          submission_count: number | null
          success_message: string | null
          theme: string | null
          title: string | null
          updated_at: string | null
          user_id: string
          workspace_id: string
        }
        Insert: {
          allow_attachments?: boolean | null
          categories?: string[] | null
          created_at?: string | null
          description?: string | null
          domains?: string[] | null
          id?: string
          is_active?: boolean | null
          name: string
          placeholder?: string | null
          position?: string | null
          primary_color?: string | null
          require_email?: boolean | null
          settings?: Json | null
          show_emoji_rating?: boolean | null
          slug?: string | null
          submission_count?: number | null
          success_message?: string | null
          theme?: string | null
          title?: string | null
          updated_at?: string | null
          user_id: string
          workspace_id: string
        }
        Update: {
          allow_attachments?: boolean | null
          categories?: string[] | null
          created_at?: string | null
          description?: string | null
          domains?: string[] | null
          id?: string
          is_active?: boolean | null
          name?: string
          placeholder?: string | null
          position?: string | null
          primary_color?: string | null
          require_email?: boolean | null
          settings?: Json | null
          show_emoji_rating?: boolean | null
          slug?: string | null
          submission_count?: number | null
          success_message?: string | null
          theme?: string | null
          title?: string | null
          updated_at?: string | null
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feedback_widgets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feedback_widgets_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "user_workspaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feedback_widgets_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_activities: {
        Row: {
          action: string
          created_at: string | null
          description: string | null
          from_status: Database["public"]["Enums"]["invoice_status"] | null
          id: string
          invoice_id: string
          metadata: Json | null
          to_status: Database["public"]["Enums"]["invoice_status"] | null
          user_id: string | null
          workspace_id: string
        }
        Insert: {
          action: string
          created_at?: string | null
          description?: string | null
          from_status?: Database["public"]["Enums"]["invoice_status"] | null
          id?: string
          invoice_id: string
          metadata?: Json | null
          to_status?: Database["public"]["Enums"]["invoice_status"] | null
          user_id?: string | null
          workspace_id: string
        }
        Update: {
          action?: string
          created_at?: string | null
          description?: string | null
          from_status?: Database["public"]["Enums"]["invoice_status"] | null
          id?: string
          invoice_id?: string
          metadata?: Json | null
          to_status?: Database["public"]["Enums"]["invoice_status"] | null
          user_id?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoice_activities_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_activities_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_activities_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "user_workspaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_activities_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_items: {
        Row: {
          amount: number
          created_at: string | null
          description: string
          id: string
          invoice_id: string
          is_taxable: boolean | null
          metadata: Json | null
          position: number | null
          quantity: number
          task_id: string | null
          tax_rate: number | null
          time_entry_id: string | null
          type: Database["public"]["Enums"]["invoice_item_type"] | null
          unit: string | null
          unit_price: number
          updated_at: string | null
          workspace_id: string
        }
        Insert: {
          amount?: number
          created_at?: string | null
          description: string
          id?: string
          invoice_id: string
          is_taxable?: boolean | null
          metadata?: Json | null
          position?: number | null
          quantity?: number
          task_id?: string | null
          tax_rate?: number | null
          time_entry_id?: string | null
          type?: Database["public"]["Enums"]["invoice_item_type"] | null
          unit?: string | null
          unit_price?: number
          updated_at?: string | null
          workspace_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          description?: string
          id?: string
          invoice_id?: string
          is_taxable?: boolean | null
          metadata?: Json | null
          position?: number | null
          quantity?: number
          task_id?: string | null
          tax_rate?: number | null
          time_entry_id?: string | null
          type?: Database["public"]["Enums"]["invoice_item_type"] | null
          unit?: string | null
          unit_price?: number
          updated_at?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_items_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_items_time_entry_id_fkey"
            columns: ["time_entry_id"]
            isOneToOne: false
            referencedRelation: "time_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_items_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "user_workspaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_items_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_payments: {
        Row: {
          amount: number
          created_at: string | null
          currency: string
          id: string
          invoice_id: string
          metadata: Json | null
          notes: string | null
          payment_date: string
          payment_method: Database["public"]["Enums"]["payment_method"]
          reference: string | null
          user_id: string
          workspace_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          currency?: string
          id?: string
          invoice_id: string
          metadata?: Json | null
          notes?: string | null
          payment_date?: string
          payment_method: Database["public"]["Enums"]["payment_method"]
          reference?: string | null
          user_id: string
          workspace_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          currency?: string
          id?: string
          invoice_id?: string
          metadata?: Json | null
          notes?: string | null
          payment_date?: string
          payment_method?: Database["public"]["Enums"]["payment_method"]
          reference?: string | null
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoice_payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_payments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_payments_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "user_workspaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_payments_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          accent_color: string | null
          amount_paid: number | null
          client_address: string | null
          client_company: string | null
          client_email: string
          client_name: string
          client_phone: string | null
          client_tax_id: string | null
          contact_id: string | null
          created_at: string | null
          currency: string
          discount_amount: number | null
          due_date: string
          footer: string | null
          id: string
          invoice_number: string
          issue_date: string
          logo_url: string | null
          metadata: Json | null
          notes: string | null
          paid_date: string | null
          payment_method: Database["public"]["Enums"]["payment_method"] | null
          payment_reference: string | null
          project_id: string | null
          public_token: string | null
          reference: string | null
          sent_at: string | null
          status: Database["public"]["Enums"]["invoice_status"] | null
          subtotal: number
          tax_amount: number | null
          tax_rate: number | null
          terms: string | null
          total: number
          updated_at: string | null
          user_id: string
          view_count: number | null
          viewed_at: string | null
          workspace_id: string
        }
        Insert: {
          accent_color?: string | null
          amount_paid?: number | null
          client_address?: string | null
          client_company?: string | null
          client_email: string
          client_name: string
          client_phone?: string | null
          client_tax_id?: string | null
          contact_id?: string | null
          created_at?: string | null
          currency?: string
          discount_amount?: number | null
          due_date: string
          footer?: string | null
          id?: string
          invoice_number: string
          issue_date?: string
          logo_url?: string | null
          metadata?: Json | null
          notes?: string | null
          paid_date?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          payment_reference?: string | null
          project_id?: string | null
          public_token?: string | null
          reference?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["invoice_status"] | null
          subtotal?: number
          tax_amount?: number | null
          tax_rate?: number | null
          terms?: string | null
          total?: number
          updated_at?: string | null
          user_id: string
          view_count?: number | null
          viewed_at?: string | null
          workspace_id: string
        }
        Update: {
          accent_color?: string | null
          amount_paid?: number | null
          client_address?: string | null
          client_company?: string | null
          client_email?: string
          client_name?: string
          client_phone?: string | null
          client_tax_id?: string | null
          contact_id?: string | null
          created_at?: string | null
          currency?: string
          discount_amount?: number | null
          due_date?: string
          footer?: string | null
          id?: string
          invoice_number?: string
          issue_date?: string
          logo_url?: string | null
          metadata?: Json | null
          notes?: string | null
          paid_date?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          payment_reference?: string | null
          project_id?: string | null
          public_token?: string | null
          reference?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["invoice_status"] | null
          subtotal?: number
          tax_amount?: number | null
          tax_rate?: number | null
          terms?: string | null
          total?: number
          updated_at?: string | null
          user_id?: string
          view_count?: number | null
          viewed_at?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "user_workspaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      landing_page_analytics: {
        Row: {
          browser: string | null
          country: string | null
          created_at: string | null
          device: string | null
          event_data: Json | null
          event_type: string
          id: string
          ip_address: unknown
          page_id: string
          referrer: string | null
          session_id: string | null
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
          visitor_id: string | null
        }
        Insert: {
          browser?: string | null
          country?: string | null
          created_at?: string | null
          device?: string | null
          event_data?: Json | null
          event_type: string
          id?: string
          ip_address?: unknown
          page_id: string
          referrer?: string | null
          session_id?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          visitor_id?: string | null
        }
        Update: {
          browser?: string | null
          country?: string | null
          created_at?: string | null
          device?: string | null
          event_data?: Json | null
          event_type?: string
          id?: string
          ip_address?: unknown
          page_id?: string
          referrer?: string | null
          session_id?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          visitor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "landing_page_analytics_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "landing_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      landing_page_leads: {
        Row: {
          created_at: string | null
          data: Json | null
          email: string
          id: string
          ip_address: unknown
          name: string | null
          page_id: string
          referrer: string | null
          source: string | null
          user_agent: string | null
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
          workspace_id: string
        }
        Insert: {
          created_at?: string | null
          data?: Json | null
          email: string
          id?: string
          ip_address?: unknown
          name?: string | null
          page_id: string
          referrer?: string | null
          source?: string | null
          user_agent?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          workspace_id: string
        }
        Update: {
          created_at?: string | null
          data?: Json | null
          email?: string
          id?: string
          ip_address?: unknown
          name?: string | null
          page_id?: string
          referrer?: string | null
          source?: string | null
          user_agent?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "landing_page_leads_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "landing_pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "landing_page_leads_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "user_workspaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "landing_page_leads_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      landing_pages: {
        Row: {
          content: Json | null
          conversion_count: number | null
          created_at: string | null
          custom_css: string | null
          custom_domain: string | null
          custom_js: string | null
          description: string | null
          favicon: string | null
          id: string
          meta_description: string | null
          meta_title: string | null
          og_image: string | null
          password: string | null
          published_at: string | null
          slug: string
          status: Database["public"]["Enums"]["page_status"] | null
          template: string | null
          title: string
          updated_at: string | null
          user_id: string
          view_count: number | null
          workspace_id: string
        }
        Insert: {
          content?: Json | null
          conversion_count?: number | null
          created_at?: string | null
          custom_css?: string | null
          custom_domain?: string | null
          custom_js?: string | null
          description?: string | null
          favicon?: string | null
          id?: string
          meta_description?: string | null
          meta_title?: string | null
          og_image?: string | null
          password?: string | null
          published_at?: string | null
          slug: string
          status?: Database["public"]["Enums"]["page_status"] | null
          template?: string | null
          title: string
          updated_at?: string | null
          user_id: string
          view_count?: number | null
          workspace_id: string
        }
        Update: {
          content?: Json | null
          conversion_count?: number | null
          created_at?: string | null
          custom_css?: string | null
          custom_domain?: string | null
          custom_js?: string | null
          description?: string | null
          favicon?: string | null
          id?: string
          meta_description?: string | null
          meta_title?: string | null
          og_image?: string | null
          password?: string | null
          published_at?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["page_status"] | null
          template?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
          view_count?: number | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "landing_pages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "landing_pages_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "user_workspaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "landing_pages_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      mrr_history: {
        Row: {
          arr: number | null
          churn_rate: number | null
          churned_customers: number | null
          created_at: string | null
          growth_rate: number | null
          id: string
          mrr: number
          mrr_churned: number | null
          mrr_contraction: number | null
          mrr_expansion: number | null
          mrr_new: number | null
          mrr_reactivation: number | null
          net_mrr_change: number | null
          new_customers: number | null
          period_date: string
          period_type: Database["public"]["Enums"]["metric_period"] | null
          reactivated_customers: number | null
          total_customers: number | null
          workspace_id: string
        }
        Insert: {
          arr?: number | null
          churn_rate?: number | null
          churned_customers?: number | null
          created_at?: string | null
          growth_rate?: number | null
          id?: string
          mrr?: number
          mrr_churned?: number | null
          mrr_contraction?: number | null
          mrr_expansion?: number | null
          mrr_new?: number | null
          mrr_reactivation?: number | null
          net_mrr_change?: number | null
          new_customers?: number | null
          period_date: string
          period_type?: Database["public"]["Enums"]["metric_period"] | null
          reactivated_customers?: number | null
          total_customers?: number | null
          workspace_id: string
        }
        Update: {
          arr?: number | null
          churn_rate?: number | null
          churned_customers?: number | null
          created_at?: string | null
          growth_rate?: number | null
          id?: string
          mrr?: number
          mrr_churned?: number | null
          mrr_contraction?: number | null
          mrr_expansion?: number | null
          mrr_new?: number | null
          mrr_reactivation?: number | null
          net_mrr_change?: number | null
          new_customers?: number | null
          period_date?: string
          period_type?: Database["public"]["Enums"]["metric_period"] | null
          reactivated_customers?: number | null
          total_customers?: number | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mrr_history_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "user_workspaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mrr_history_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          is_read: boolean | null
          link: string | null
          message: string | null
          title: string
          type: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          link?: string | null
          message?: string | null
          title: string
          type?: string
          user_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          link?: string | null
          message?: string | null
          title?: string
          type?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "user_workspaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      pipeline_stages: {
        Row: {
          color: string | null
          created_at: string | null
          id: string
          is_lost: boolean | null
          is_won: boolean | null
          name: string
          position: number
          updated_at: string | null
          workspace_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          id?: string
          is_lost?: boolean | null
          is_won?: boolean | null
          name: string
          position?: number
          updated_at?: string | null
          workspace_id: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          id?: string
          is_lost?: boolean | null
          is_won?: boolean | null
          name?: string
          position?: number
          updated_at?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pipeline_stages_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "user_workspaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pipeline_stages_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          onboarding_completed: boolean | null
          preferences: Json | null
          role: Database["public"]["Enums"]["user_role"] | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email: string
          full_name?: string | null
          id: string
          onboarding_completed?: boolean | null
          preferences?: Json | null
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          onboarding_completed?: boolean | null
          preferences?: Json | null
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      projects: {
        Row: {
          budget: number | null
          budget_hours: number | null
          color: string | null
          completed_at: string | null
          created_at: string | null
          description: string | null
          due_date: string | null
          hourly_rate: number | null
          id: string
          metadata: Json | null
          name: string
          start_date: string | null
          status: Database["public"]["Enums"]["project_status"] | null
          updated_at: string | null
          user_id: string
          workspace_id: string
        }
        Insert: {
          budget?: number | null
          budget_hours?: number | null
          color?: string | null
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          hourly_rate?: number | null
          id?: string
          metadata?: Json | null
          name: string
          start_date?: string | null
          status?: Database["public"]["Enums"]["project_status"] | null
          updated_at?: string | null
          user_id: string
          workspace_id: string
        }
        Update: {
          budget?: number | null
          budget_hours?: number | null
          color?: string | null
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          hourly_rate?: number | null
          id?: string
          metadata?: Json | null
          name?: string
          start_date?: string | null
          status?: Database["public"]["Enums"]["project_status"] | null
          updated_at?: string | null
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "user_workspaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      revenue_events: {
        Row: {
          amount: number
          created_at: string | null
          currency: string | null
          customer_id: string | null
          description: string | null
          event_date: string | null
          event_type: string
          failure_reason: string | null
          id: string
          metadata: Json | null
          mrr_impact: number | null
          plan_from: string | null
          plan_to: string | null
          status: string | null
          stripe_charge_id: string | null
          stripe_event_id: string | null
          stripe_invoice_id: string | null
          subscription_id: string | null
          workspace_id: string
        }
        Insert: {
          amount?: number
          created_at?: string | null
          currency?: string | null
          customer_id?: string | null
          description?: string | null
          event_date?: string | null
          event_type: string
          failure_reason?: string | null
          id?: string
          metadata?: Json | null
          mrr_impact?: number | null
          plan_from?: string | null
          plan_to?: string | null
          status?: string | null
          stripe_charge_id?: string | null
          stripe_event_id?: string | null
          stripe_invoice_id?: string | null
          subscription_id?: string | null
          workspace_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          currency?: string | null
          customer_id?: string | null
          description?: string | null
          event_date?: string | null
          event_type?: string
          failure_reason?: string | null
          id?: string
          metadata?: Json | null
          mrr_impact?: number | null
          plan_from?: string | null
          plan_to?: string | null
          status?: string | null
          stripe_charge_id?: string | null
          stripe_event_id?: string | null
          stripe_invoice_id?: string | null
          subscription_id?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "revenue_events_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "revenue_events_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "stripe_subscriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "revenue_events_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "user_workspaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "revenue_events_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      stripe_subscriptions: {
        Row: {
          amount: number
          billing_cycle_anchor: string | null
          canceled_at: string | null
          collection_method: string | null
          created_at: string | null
          currency: string | null
          current_period_end: string | null
          current_period_start: string | null
          customer_id: string | null
          ended_at: string | null
          id: string
          interval: string | null
          interval_count: number | null
          metadata: Json | null
          mrr: number
          plan_id: string | null
          plan_name: string | null
          price_id: string | null
          status: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id: string
          stripe_subscription_id: string
          synced_at: string | null
          trial_end: string | null
          trial_start: string | null
          updated_at: string | null
          workspace_id: string
        }
        Insert: {
          amount: number
          billing_cycle_anchor?: string | null
          canceled_at?: string | null
          collection_method?: string | null
          created_at?: string | null
          currency?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          customer_id?: string | null
          ended_at?: string | null
          id?: string
          interval?: string | null
          interval_count?: number | null
          metadata?: Json | null
          mrr: number
          plan_id?: string | null
          plan_name?: string | null
          price_id?: string | null
          status: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id: string
          stripe_subscription_id: string
          synced_at?: string | null
          trial_end?: string | null
          trial_start?: string | null
          updated_at?: string | null
          workspace_id: string
        }
        Update: {
          amount?: number
          billing_cycle_anchor?: string | null
          canceled_at?: string | null
          collection_method?: string | null
          created_at?: string | null
          currency?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          customer_id?: string | null
          ended_at?: string | null
          id?: string
          interval?: string | null
          interval_count?: number | null
          metadata?: Json | null
          mrr?: number
          plan_id?: string | null
          plan_name?: string | null
          price_id?: string | null
          status?: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id?: string
          stripe_subscription_id?: string
          synced_at?: string | null
          trial_end?: string | null
          trial_start?: string | null
          updated_at?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stripe_subscriptions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stripe_subscriptions_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "user_workspaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stripe_subscriptions_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      stripe_sync_log: {
        Row: {
          completed_at: string | null
          duration_ms: number | null
          error_details: Json | null
          error_message: string | null
          id: string
          metadata: Json | null
          records_created: number | null
          records_failed: number | null
          records_synced: number | null
          records_updated: number | null
          started_at: string | null
          status: string
          sync_type: string
          triggered_by: string | null
          workspace_id: string
        }
        Insert: {
          completed_at?: string | null
          duration_ms?: number | null
          error_details?: Json | null
          error_message?: string | null
          id?: string
          metadata?: Json | null
          records_created?: number | null
          records_failed?: number | null
          records_synced?: number | null
          records_updated?: number | null
          started_at?: string | null
          status: string
          sync_type: string
          triggered_by?: string | null
          workspace_id: string
        }
        Update: {
          completed_at?: string | null
          duration_ms?: number | null
          error_details?: Json | null
          error_message?: string | null
          id?: string
          metadata?: Json | null
          records_created?: number | null
          records_failed?: number | null
          records_synced?: number | null
          records_updated?: number | null
          started_at?: string | null
          status?: string
          sync_type?: string
          triggered_by?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stripe_sync_log_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "user_workspaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stripe_sync_log_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          created_at: string | null
          current_period_end: string | null
          current_period_start: string | null
          id: string
          plan: string | null
          status: string | null
          stripe_customer_id: string | null
          stripe_price_id: string | null
          stripe_subscription_id: string | null
          trial_ends_at: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan?: string | null
          status?: string | null
          stripe_customer_id?: string | null
          stripe_price_id?: string | null
          stripe_subscription_id?: string | null
          trial_ends_at?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan?: string | null
          status?: string | null
          stripe_customer_id?: string | null
          stripe_price_id?: string | null
          stripe_subscription_id?: string | null
          trial_ends_at?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          assignee_id: string | null
          completed_at: string | null
          created_at: string | null
          description: string | null
          due_date: string | null
          estimated_hours: number | null
          id: string
          position: number | null
          priority: Database["public"]["Enums"]["task_priority"] | null
          project_id: string | null
          status: Database["public"]["Enums"]["task_status"] | null
          tags: string[] | null
          title: string
          updated_at: string | null
          user_id: string
          workspace_id: string
        }
        Insert: {
          assignee_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          estimated_hours?: number | null
          id?: string
          position?: number | null
          priority?: Database["public"]["Enums"]["task_priority"] | null
          project_id?: string | null
          status?: Database["public"]["Enums"]["task_status"] | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
          user_id: string
          workspace_id: string
        }
        Update: {
          assignee_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          estimated_hours?: number | null
          id?: string
          position?: number | null
          priority?: Database["public"]["Enums"]["task_priority"] | null
          project_id?: string | null
          status?: Database["public"]["Enums"]["task_status"] | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_assignee_id_fkey"
            columns: ["assignee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "user_workspaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      time_entries: {
        Row: {
          created_at: string | null
          description: string | null
          duration_minutes: number | null
          ended_at: string | null
          id: string
          is_billable: boolean | null
          is_running: boolean | null
          project_id: string | null
          started_at: string
          task_id: string | null
          updated_at: string | null
          user_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          duration_minutes?: number | null
          ended_at?: string | null
          id?: string
          is_billable?: boolean | null
          is_running?: boolean | null
          project_id?: string | null
          started_at: string
          task_id?: string | null
          updated_at?: string | null
          user_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          duration_minutes?: number | null
          ended_at?: string | null
          id?: string
          is_billable?: boolean | null
          is_running?: boolean | null
          project_id?: string | null
          started_at?: string
          task_id?: string | null
          updated_at?: string | null
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "time_entries_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_entries_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_entries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_entries_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "user_workspaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_entries_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      vault_collections: {
        Row: {
          color: string | null
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          is_public: boolean | null
          item_count: number | null
          name: string
          updated_at: string | null
          user_id: string
          workspace_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_public?: boolean | null
          item_count?: number | null
          name: string
          updated_at?: string | null
          user_id: string
          workspace_id: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_public?: boolean | null
          item_count?: number | null
          name?: string
          updated_at?: string | null
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vault_collections_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vault_collections_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "user_workspaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vault_collections_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      vault_items: {
        Row: {
          collection_id: string | null
          content: string
          created_at: string | null
          description: string | null
          id: string
          is_favorite: boolean | null
          is_public: boolean | null
          language: string | null
          metadata: Json | null
          tags: string[] | null
          title: string
          type: Database["public"]["Enums"]["vault_item_type"] | null
          updated_at: string | null
          use_count: number | null
          user_id: string
          workspace_id: string
        }
        Insert: {
          collection_id?: string | null
          content: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_favorite?: boolean | null
          is_public?: boolean | null
          language?: string | null
          metadata?: Json | null
          tags?: string[] | null
          title: string
          type?: Database["public"]["Enums"]["vault_item_type"] | null
          updated_at?: string | null
          use_count?: number | null
          user_id: string
          workspace_id: string
        }
        Update: {
          collection_id?: string | null
          content?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_favorite?: boolean | null
          is_public?: boolean | null
          language?: string | null
          metadata?: Json | null
          tags?: string[] | null
          title?: string
          type?: Database["public"]["Enums"]["vault_item_type"] | null
          updated_at?: string | null
          use_count?: number | null
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vault_items_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "vault_collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vault_items_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vault_items_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "user_workspaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vault_items_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_members: {
        Row: {
          created_at: string | null
          id: string
          joined_at: string | null
          permissions: Json | null
          role: Database["public"]["Enums"]["workspace_role"]
          updated_at: string | null
          user_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          joined_at?: string | null
          permissions?: Json | null
          role?: Database["public"]["Enums"]["workspace_role"]
          updated_at?: string | null
          user_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          joined_at?: string | null
          permissions?: Json | null
          role?: Database["public"]["Enums"]["workspace_role"]
          updated_at?: string | null
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_members_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "user_workspaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_members_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspaces: {
        Row: {
          created_at: string | null
          id: string
          logo_url: string | null
          name: string
          owner_id: string
          settings: Json | null
          slug: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          logo_url?: string | null
          name: string
          owner_id: string
          settings?: Json | null
          slug: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          owner_id?: string
          settings?: Json | null
          slug?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workspaces_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      user_workspaces: {
        Row: {
          created_at: string | null
          id: string | null
          joined_at: string | null
          logo_url: string | null
          name: string | null
          owner_id: string | null
          permissions: Json | null
          role: Database["public"]["Enums"]["workspace_role"] | null
          settings: Json | null
          slug: string | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workspaces_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      calculate_churn_risk: {
        Args: {
          p_days_until_renewal: number
          p_failed_payment_count: number
          p_last_payment_date: string
          p_subscription_status: Database["public"]["Enums"]["subscription_status"]
        }
        Returns: number
      }
      calculate_mrr: {
        Args: {
          p_amount: number
          p_interval: string
          p_interval_count?: number
        }
        Returns: number
      }
      calculate_next_cron_run: {
        Args: { cron_expr: string; from_time?: string; tz?: string }
        Returns: string
      }
      check_overdue_invoices: { Args: never; Returns: undefined }
      generate_invoice_number: {
        Args: { p_workspace_id: string }
        Returns: string
      }
      get_workspace_mrr_summary: {
        Args: { p_workspace_id: string }
        Returns: {
          active_customers: number
          at_risk_customers: number
          avg_mrr_per_customer: number
          churn_rate: number
          churned_customers: number
          total_arr: number
          total_customers: number
          total_mrr: number
        }[]
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
    }
    Enums: {
      automation_action_type:
        | "send_email"
        | "create_task"
        | "update_contact"
        | "add_tag"
        | "remove_tag"
        | "move_deal"
        | "create_deal"
        | "update_deal"
        | "webhook"
        | "delay"
        | "condition"
      automation_log_level: "info" | "warning" | "error" | "debug"
      automation_run_status:
        | "pending"
        | "running"
        | "completed"
        | "failed"
        | "cancelled"
      automation_status: "active" | "paused" | "draft" | "archived"
      automation_trigger_type:
        | "new_contact"
        | "contact_updated"
        | "contact_tagged"
        | "deal_created"
        | "deal_stage_changed"
        | "deal_won"
        | "deal_lost"
        | "form_submitted"
        | "feedback_received"
        | "task_completed"
        | "task_created"
        | "scheduled"
        | "webhook"
        | "manual"
      contact_source:
        | "manual"
        | "import"
        | "landing_page"
        | "api"
        | "integration"
      contact_status: "active" | "inactive" | "archived"
      customer_status: "active" | "churned" | "at_risk" | "new"
      deal_activity_type:
        | "note"
        | "call"
        | "email"
        | "meeting"
        | "task"
        | "stage_change"
        | "value_change"
      deal_status: "open" | "won" | "lost"
      feedback_status:
        | "new"
        | "under_review"
        | "planned"
        | "in_progress"
        | "completed"
        | "declined"
      feedback_type: "bug" | "feature" | "improvement" | "question" | "other"
      invoice_item_type: "service" | "product" | "expense" | "discount" | "tax"
      invoice_status:
        | "draft"
        | "sent"
        | "viewed"
        | "paid"
        | "overdue"
        | "cancelled"
        | "refunded"
      metric_period: "daily" | "weekly" | "monthly" | "quarterly" | "yearly"
      page_status: "draft" | "published" | "archived"
      payment_method:
        | "stripe"
        | "paypal"
        | "bank_transfer"
        | "cash"
        | "check"
        | "other"
      post_platform:
        | "twitter"
        | "linkedin"
        | "facebook"
        | "instagram"
        | "threads"
        | "blog"
      post_status: "draft" | "scheduled" | "published" | "archived"
      project_status: "active" | "on_hold" | "completed" | "archived"
      subscription_status:
        | "active"
        | "past_due"
        | "canceled"
        | "incomplete"
        | "incomplete_expired"
        | "trialing"
        | "unpaid"
        | "paused"
      task_priority: "low" | "medium" | "high" | "urgent"
      task_status: "todo" | "in_progress" | "review" | "done"
      user_role: "user" | "admin"
      vault_item_type: "snippet" | "prompt" | "component" | "template" | "note"
      workspace_role: "owner" | "admin" | "editor" | "viewer"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

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
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
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
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
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
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
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
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
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
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      automation_action_type: [
        "send_email",
        "create_task",
        "update_contact",
        "add_tag",
        "remove_tag",
        "move_deal",
        "create_deal",
        "update_deal",
        "webhook",
        "delay",
        "condition",
      ],
      automation_log_level: ["info", "warning", "error", "debug"],
      automation_run_status: [
        "pending",
        "running",
        "completed",
        "failed",
        "cancelled",
      ],
      automation_status: ["active", "paused", "draft", "archived"],
      automation_trigger_type: [
        "new_contact",
        "contact_updated",
        "contact_tagged",
        "deal_created",
        "deal_stage_changed",
        "deal_won",
        "deal_lost",
        "form_submitted",
        "feedback_received",
        "task_completed",
        "task_created",
        "scheduled",
        "webhook",
        "manual",
      ],
      contact_source: [
        "manual",
        "import",
        "landing_page",
        "api",
        "integration",
      ],
      contact_status: ["active", "inactive", "archived"],
      customer_status: ["active", "churned", "at_risk", "new"],
      deal_activity_type: [
        "note",
        "call",
        "email",
        "meeting",
        "task",
        "stage_change",
        "value_change",
      ],
      deal_status: ["open", "won", "lost"],
      feedback_status: [
        "new",
        "under_review",
        "planned",
        "in_progress",
        "completed",
        "declined",
      ],
      feedback_type: ["bug", "feature", "improvement", "question", "other"],
      invoice_item_type: ["service", "product", "expense", "discount", "tax"],
      invoice_status: [
        "draft",
        "sent",
        "viewed",
        "paid",
        "overdue",
        "cancelled",
        "refunded",
      ],
      metric_period: ["daily", "weekly", "monthly", "quarterly", "yearly"],
      page_status: ["draft", "published", "archived"],
      payment_method: [
        "stripe",
        "paypal",
        "bank_transfer",
        "cash",
        "check",
        "other",
      ],
      post_platform: [
        "twitter",
        "linkedin",
        "facebook",
        "instagram",
        "threads",
        "blog",
      ],
      post_status: ["draft", "scheduled", "published", "archived"],
      project_status: ["active", "on_hold", "completed", "archived"],
      subscription_status: [
        "active",
        "past_due",
        "canceled",
        "incomplete",
        "incomplete_expired",
        "trialing",
        "unpaid",
        "paused",
      ],
      task_priority: ["low", "medium", "high", "urgent"],
      task_status: ["todo", "in_progress", "review", "done"],
      user_role: ["user", "admin"],
      vault_item_type: ["snippet", "prompt", "component", "template", "note"],
      workspace_role: ["owner", "admin", "editor", "viewer"],
    },
  },
} as const

// Convenience type aliases for common table row types
export type Profile = Database["public"]["Tables"]["profiles"]["Row"]
export type Subscription = Database["public"]["Tables"]["subscriptions"]["Row"]
export type Notification = Database["public"]["Tables"]["notifications"]["Row"]
