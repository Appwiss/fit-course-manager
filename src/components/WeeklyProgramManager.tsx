import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

import { WeeklyProgram, DaySchedule, Course } from '@/types/fitness';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Plus, Trash2, Calendar, BookOpen, Moon } from 'lucide-react';

const DAYS_OF_WEEK = [
  { id: 1, name: 'Lundi', shortName: 'Lun' },
  { id: 2, name: 'Mardi', shortName: 'Mar' },
  { id: 3, name: 'Mercredi', shortName: 'Mer' },
  { id: 4, name: 'Jeudi', shortName: 'Jeu' },
  { id: 5, name: 'Vendredi', shortName: 'Ven' },
  { id: 6, name: 'Samedi', shortName: 'Sam' },
  { id: 0, name: 'Dimanche', shortName: 'Dim' },
];

export function WeeklyProgramManager() {
  const [programs, setPrograms] = useState<WeeklyProgram[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [showCreateProgram, setShowCreateProgram] = useState(false);
  const [editingProgram, setEditingProgram] = useState<WeeklyProgram | null>(null);
  const [newProgram, setNewProgram] = useState({
    name: '',
    description: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Charger les programmes depuis Supabase
      const { data: programsData } = await supabase
        .from('weekly_programs')
        .select(`
          *,
          day_schedules(
            *,
            schedule_courses(course_id, order_index)
          )
        `);
      
      if (programsData) {
        const formattedPrograms = programsData.map((program: any) => ({
          id: program.id,
          name: program.name,
          description: program.description || '',
          createdAt: program.created_at,
          schedule: program.day_schedules.map((schedule: any) => ({
            dayOfWeek: schedule.day_of_week,
            dayName: schedule.day_name,
            isRestDay: schedule.is_rest_day,
            courses: schedule.schedule_courses
              .sort((a: any, b: any) => a.order_index - b.order_index)
              .map((sc: any) => sc.course_id),
            restDescription: schedule.rest_description
          }))
        }));
        setPrograms(formattedPrograms);
      }

      // Charger les cours depuis Supabase
      const { data: coursesData } = await supabase
        .from('courses')
        .select('*');
      
      if (coursesData) {
        const formattedCourses: Course[] = coursesData.map(course => ({
          id: course.id,
          title: course.title,
          description: course.description || '',
          videoUrl: course.video_url || '',
          level: course.level,
          category: course.category || '',
          duration: course.duration || 30,
          instructor: course.instructor || '',
          thumbnail: course.thumbnail || ''
        }));
        setCourses(formattedCourses);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    }
  };

  const createDefaultSchedule = (): DaySchedule[] => {
    return DAYS_OF_WEEK.map(day => ({
      dayOfWeek: day.id,
      dayName: day.name,
      isRestDay: false,
      courses: [],
      restDescription: ''
    }));
  };

  const handleCreateProgram = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newProgram.name.trim()) {
      toast.error('Le nom du programme est requis');
      return;
    }

    const program: WeeklyProgram = {
      id: `program-${Date.now()}`,
      name: newProgram.name,
      description: newProgram.description,
      createdAt: new Date().toISOString(),
      schedule: createDefaultSchedule()
    };

    // Already handled with Supabase in createProgram
    loadData();
    setNewProgram({ name: '', description: '' });
    setShowCreateProgram(false);
    toast.success('Programme créé avec succès');
  };

  const handleUpdateProgram = () => {
    if (!editingProgram) return;
    
    // Already handled with Supabase in updateProgram
    loadData();
    setEditingProgram(null);
    toast.success('Programme mis à jour');
  };

  const handleDeleteProgram = (programId: string) => {
    // Already handled with Supabase in deleteProgram
    loadData();
    toast.success('Programme supprimé');
  };

  const toggleRestDay = (programId: string, dayOfWeek: number) => {
    if (!editingProgram || editingProgram.id !== programId) return;
    
    const updatedSchedule = editingProgram.schedule.map(day => {
      if (day.dayOfWeek === dayOfWeek) {
        return {
          ...day,
          isRestDay: !day.isRestDay,
          courses: !day.isRestDay ? [] : day.courses,
          restDescription: !day.isRestDay ? 'Repos musculaire' : day.restDescription
        };
      }
      return day;
    });

    setEditingProgram({
      ...editingProgram,
      schedule: updatedSchedule
    });
  };

  const addCourseToDay = (programId: string, dayOfWeek: number, courseId: string) => {
    if (!editingProgram || editingProgram.id !== programId) return;
    
    const updatedSchedule = editingProgram.schedule.map(day => {
      if (day.dayOfWeek === dayOfWeek && !day.isRestDay && !day.courses.includes(courseId)) {
        return {
          ...day,
          courses: [...day.courses, courseId]
        };
      }
      return day;
    });

    setEditingProgram({
      ...editingProgram,
      schedule: updatedSchedule
    });
  };

  const removeCourseFromDay = (programId: string, dayOfWeek: number, courseId: string) => {
    if (!editingProgram || editingProgram.id !== programId) return;
    
    const updatedSchedule = editingProgram.schedule.map(day => {
      if (day.dayOfWeek === dayOfWeek) {
        return {
          ...day,
          courses: day.courses.filter(id => id !== courseId)
        };
      }
      return day;
    });

    setEditingProgram({
      ...editingProgram,
      schedule: updatedSchedule
    });
  };

  const getCourseById = (courseId: string) => {
    return courses.find(c => c.id === courseId);
  };

  const getTotalDuration = (day: DaySchedule) => {
    return day.courses.reduce((total, courseId) => {
      const course = getCourseById(courseId);
      return total + (course?.duration || 0);
    }, 0);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            <Calendar className="h-6 w-6" />
            Programmes par semaine
          </h2>
          <p className="text-muted-foreground">Organisez les cours par jour de la semaine</p>
        </div>
        <Button 
          onClick={() => setShowCreateProgram(!showCreateProgram)}
          className="bg-gradient-primary w-full sm:w-auto"
        >
          <Plus className="h-4 w-4 mr-2" />
          {showCreateProgram ? 'Annuler' : 'Nouveau programme'}
        </Button>
      </div>

      {/* Formulaire de création */}
      {showCreateProgram && (
        <Card>
          <CardHeader>
            <CardTitle>Créer un nouveau programme</CardTitle>
            <CardDescription>Définissez un programme d'entraînement hebdomadaire</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateProgram} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="program-name">Nom du programme *</Label>
                  <Input
                    id="program-name"
                    value={newProgram.name}
                    onChange={(e) => setNewProgram({...newProgram, name: e.target.value})}
                    placeholder="Programme débutant semaine 1"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="program-description">Description (optionnel)</Label>
                  <Input
                    id="program-description"
                    value={newProgram.description}
                    onChange={(e) => setNewProgram({...newProgram, description: e.target.value})}
                    placeholder="Description du programme..."
                  />
                </div>
              </div>
              <Button type="submit" className="bg-gradient-primary w-full">
                Créer le programme
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Liste des programmes */}
      <div className="space-y-4">
        {programs.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Aucun programme</h3>
              <p className="text-muted-foreground">Créez votre premier programme hebdomadaire</p>
            </CardContent>
          </Card>
        ) : (
          programs.map((program) => (
            <Card key={program.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <CardTitle className="text-lg">{program.name}</CardTitle>
                    {program.description && (
                      <CardDescription>{program.description}</CardDescription>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingProgram(editingProgram?.id === program.id ? null : program)}
                    >
                      {editingProgram?.id === program.id ? 'Fermer' : 'Modifier'}
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteProgram(program.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                {/* Vue grille des jours */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
                  {program.schedule.map((day) => {
                    const totalDuration = getTotalDuration(day);
                    return (
                      <div
                        key={day.dayOfWeek}
                        className={`p-3 rounded-lg border transition-colors ${
                          day.isRestDay 
                            ? 'bg-muted/50 border-muted' 
                            : day.courses.length > 0 
                              ? 'bg-primary/5 border-primary/20' 
                              : 'bg-background border-border'
                        }`}
                      >
                        <div className="text-sm font-medium mb-2 flex items-center justify-between">
                          <span>{DAYS_OF_WEEK.find(d => d.id === day.dayOfWeek)?.shortName}</span>
                          {day.isRestDay ? (
                            <Moon className="h-3 w-3 text-muted-foreground" />
                          ) : day.courses.length > 0 ? (
                            <Badge variant="secondary" className="text-xs">
                              {totalDuration}min
                            </Badge>
                          ) : null}
                        </div>
                        
                        {day.isRestDay ? (
                          <div className="text-xs text-muted-foreground">
                            {day.restDescription || 'Repos'}
                          </div>
                        ) : day.courses.length > 0 ? (
                          <div className="space-y-1">
                            {day.courses.map((courseId) => {
                              const course = getCourseById(courseId);
                              return course ? (
                                <div
                                  key={courseId}
                                  className="text-xs p-1 bg-background rounded border"
                                >
                                  <div className="font-medium truncate">{course.title}</div>
                                  <div className="text-muted-foreground">
                                    {course.duration}min • {course.level}
                                  </div>
                                </div>
                              ) : null;
                            })}
                          </div>
                        ) : (
                          <div className="text-xs text-muted-foreground">Aucun cours</div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Édition détaillée */}
                {editingProgram?.id === program.id && (
                  <div className="mt-6 pt-6 border-t border-border space-y-6">
                    <h4 className="font-semibold">Configuration des jours</h4>
                    
                    {DAYS_OF_WEEK.map((dayInfo) => {
                      const daySchedule = editingProgram.schedule.find(d => d.dayOfWeek === dayInfo.id);
                      if (!daySchedule) return null;

                      return (
                        <Card key={dayInfo.id} className="p-4">
                          <div className="flex items-center justify-between mb-4">
                            <h5 className="font-medium">{dayInfo.name}</h5>
                            <div className="flex items-center gap-2">
                              <Label htmlFor={`rest-${dayInfo.id}`} className="text-sm">
                                Repos musculaire
                              </Label>
                              <Switch
                                id={`rest-${dayInfo.id}`}
                                checked={daySchedule.isRestDay}
                                onCheckedChange={() => toggleRestDay(program.id, dayInfo.id)}
                              />
                            </div>
                          </div>

                          {!daySchedule.isRestDay && (
                            <div className="space-y-3">
                              {/* Sélection des cours */}
                              <div className="flex gap-2">
                                <Select onValueChange={(courseId) => addCourseToDay(program.id, dayInfo.id, courseId)}>
                                  <SelectTrigger className="flex-1">
                                    <SelectValue placeholder="Ajouter un cours" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {courses
                                      .filter(course => !daySchedule.courses.includes(course.id))
                                      .map((course) => (
                                        <SelectItem key={course.id} value={course.id}>
                                          {course.title} ({course.duration}min - {course.level})
                                        </SelectItem>
                                      ))}
                                  </SelectContent>
                                </Select>
                              </div>

                              {/* Liste des cours ajoutés */}
                              {daySchedule.courses.length > 0 && (
                                <div className="space-y-2">
                                  {daySchedule.courses.map((courseId) => {
                                    const course = getCourseById(courseId);
                                    return course ? (
                                      <div
                                        key={courseId}
                                        className="flex items-center justify-between p-2 bg-muted rounded"
                                      >
                                        <div className="flex items-center gap-2">
                                          <BookOpen className="h-4 w-4" />
                                          <div>
                                            <div className="font-medium text-sm">{course.title}</div>
                                            <div className="text-xs text-muted-foreground">
                                              {course.duration}min • {course.level} • {course.category}
                                            </div>
                                          </div>
                                        </div>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => removeCourseFromDay(program.id, dayInfo.id, courseId)}
                                        >
                                          <Trash2 className="h-3 w-3" />
                                        </Button>
                                      </div>
                                    ) : null;
                                  })}
                                  <div className="text-sm text-muted-foreground">
                                    Total: {getTotalDuration(daySchedule)} minutes
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {daySchedule.isRestDay && (
                            <div className="text-sm text-muted-foreground italic">
                              Jour de repos musculaire - Aucun cours planifié
                            </div>
                          )}
                        </Card>
                      );
                    })}

                    <div className="flex gap-2">
                      <Button
                        onClick={handleUpdateProgram}
                        className="bg-gradient-primary"
                      >
                        Sauvegarder les modifications
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setEditingProgram(null)}
                      >
                        Annuler
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}