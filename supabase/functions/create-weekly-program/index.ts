import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create a Supabase client with the service role key
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const { name, description, schedule } = await req.json();

    if (!name || !schedule) {
      return new Response(JSON.stringify({ error: "Name and schedule are required" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Create the weekly program
    const { data: program, error: programError } = await supabaseClient
      .from('weekly_programs')
      .insert({
        name,
        description: description || null
      })
      .select()
      .single();

    if (programError) {
      console.error('Error creating program:', programError);
      return new Response(JSON.stringify({ error: programError.message }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    // Create day schedules
    for (const daySchedule of schedule) {
      const { data: dayScheduleData, error: dayError } = await supabaseClient
        .from('day_schedules')
        .insert({
          program_id: program.id,
          day_of_week: daySchedule.dayOfWeek,
          day_name: daySchedule.dayName,
          is_rest_day: daySchedule.isRestDay,
          rest_description: daySchedule.restDescription || null
        })
        .select()
        .single();

      if (dayError) {
        console.error('Error creating day schedule:', dayError);
        // Rollback: delete the program
        await supabaseClient.from('weekly_programs').delete().eq('id', program.id);
        return new Response(JSON.stringify({ error: dayError.message }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        });
      }

      // Create schedule courses if not a rest day
      if (!daySchedule.isRestDay && daySchedule.courses && daySchedule.courses.length > 0) {
        const scheduleCourses = daySchedule.courses.map((courseId: string, index: number) => ({
          schedule_id: dayScheduleData.id,
          course_id: courseId,
          order_index: index
        }));

        const { error: coursesError } = await supabaseClient
          .from('schedule_courses')
          .insert(scheduleCourses);

        if (coursesError) {
          console.error('Error creating schedule courses:', coursesError);
          // Rollback: delete the program
          await supabaseClient.from('weekly_programs').delete().eq('id', program.id);
          return new Response(JSON.stringify({ error: coursesError.message }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 500,
          });
        }
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      program: {
        id: program.id,
        name: program.name,
        description: program.description
      }
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});