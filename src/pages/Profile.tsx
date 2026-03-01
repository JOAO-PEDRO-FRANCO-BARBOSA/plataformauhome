import { useState } from 'react';
import { useProfile } from '@/hooks/useProfile';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { HabitBadges } from '@/components/HabitBadges';
import { toast } from 'sonner';
import { Camera, Upload, Loader2 } from 'lucide-react';

export default function Profile() {
  const { profile, updateProfile } = useProfile();
  const { user, refreshProfile } = useAuth();
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await updateProfile(profile);
    await refreshProfile();
    setSaving(false);
    toast.success('Preferências atualizadas! 💜');
  };

  const updateHabit = (key: string, value: any) => {
    updateProfile({ habits: { ...profile.habits, [key]: value } });
  };

  const handleMatchPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    const path = `${user.id}/match-photo-${Date.now()}`;
    const { error } = await supabase.storage.from('property-images').upload(path, file);
    if (!error) {
      const { data } = supabase.storage.from('property-images').getPublicUrl(path);
      await updateProfile({ match_photo_url: data.publicUrl });
      toast.success('Foto de match atualizada! 📸');
    } else {
      toast.error('Erro ao fazer upload');
    }
    setUploading(false);
  };

  const habits = profile.habits || {};

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Meu Perfil</h1>

      <Tabs defaultValue="dados" className="w-full">
        <TabsList className="w-full">
          <TabsTrigger value="dados" className="flex-1">Dados Pessoais</TabsTrigger>
          <TabsTrigger value="foto-match" className="flex-1">Foto para Match</TabsTrigger>
        </TabsList>

        <TabsContent value="dados" className="space-y-6 mt-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center gap-4">
                <div className="relative">
                  <img src={profile.avatar_url || '/placeholder.svg'} alt={profile.full_name} className="w-24 h-24 rounded-full object-cover border-4 border-primary/20" />
                  <button className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                    <Camera className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-3 w-full">
                  <div>
                    <Label>Nome</Label>
                    <Input value={profile.full_name} onChange={(e) => updateProfile({ full_name: e.target.value })} />
                  </div>
                  <div>
                    <Label>Curso na UFU</Label>
                    <Input value={profile.course} onChange={(e) => updateProfile({ course: e.target.value })} />
                  </div>
                  <div>
                    <Label>Campus</Label>
                    <Select value={profile.campus} onValueChange={(v) => updateProfile({ campus: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {['Santa Mônica', 'Umuarama', 'Pontal', 'Glória'].map((c) => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-lg">Preferências de Hábitos</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {([
                ['organized', 'Organizado(a)'],
                ['earlyBird', 'Diurno(a)'],
                ['likesParties', 'Gosta de festas'],
                ['smokes', 'Fumante'],
                ['hasPet', 'Tem pet'],
              ] as [string, string][]).map(([key, label]) => (
                <div key={key} className="flex items-center justify-between">
                  <Label>{label}</Label>
                  <Switch checked={!!habits[key]} onCheckedChange={(v) => updateHabit(key, v)} />
                </div>
              ))}
              <div>
                <Label>Estilo de estudo</Label>
                <Select value={habits.studyHabit || 'moderado'} onValueChange={(v) => updateHabit('studyHabit', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="silencioso">Silencioso</SelectItem>
                    <SelectItem value="moderado">Moderado</SelectItem>
                    <SelectItem value="social">Social</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="pt-2">
                <Label className="text-xs text-muted-foreground mb-2 block">Preview</Label>
                <HabitBadges habits={habits as any} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="foto-match" className="space-y-6 mt-4">
          <Card>
            <CardHeader><CardTitle className="text-lg">Foto para Match</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">Esta foto será exibida no feed de matches.</p>
              <div className="flex flex-col items-center gap-4">
                <div className="relative">
                  <img
                    src={profile.match_photo_url || profile.avatar_url || '/placeholder.svg'}
                    alt="Foto para Match"
                    className="w-48 h-64 object-cover rounded-xl border-4 border-primary/20 shadow-lg"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent rounded-xl" />
                </div>
                <label>
                  <input type="file" accept="image/*" className="hidden" onChange={handleMatchPhotoUpload} />
                  <Button variant="outline" className="gap-2" asChild disabled={uploading}>
                    <span>
                      {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                      Trocar Foto de Match
                    </span>
                  </Button>
                </label>
                <p className="text-xs text-muted-foreground text-center">
                  Dica: Use uma foto sorrindo, com boa iluminação e que mostre seu rosto claramente.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Button onClick={handleSave} className="w-full" size="lg" disabled={saving}>
        {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
        Salvar Preferências
      </Button>
    </div>
  );
}
