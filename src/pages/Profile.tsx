import { useProfile } from '@/hooks/useProfile';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { HabitBadges } from '@/components/HabitBadges';
import { toast } from 'sonner';
import { Camera, Upload } from 'lucide-react';
import { Campus, HabitProfile } from '@/types';

export default function Profile() {
  const { profile, updateProfile } = useProfile();

  const handleSave = () => {
    toast.success('Preferências atualizadas! 💜');
  };

  const updateHabit = (key: keyof HabitProfile, value: any) => {
    updateProfile({ habits: { ...profile.habits, [key]: value } });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Meu Perfil</h1>

      <Tabs defaultValue="dados" className="w-full">
        <TabsList className="w-full">
          <TabsTrigger value="dados" className="flex-1">Dados Pessoais</TabsTrigger>
          <TabsTrigger value="foto-match" className="flex-1">Foto para Match</TabsTrigger>
        </TabsList>

        <TabsContent value="dados" className="space-y-6 mt-4">
          {/* Avatar & Info */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center gap-4">
                <div className="relative">
                  <img src={profile.avatar} alt={profile.name} className="w-24 h-24 rounded-full object-cover border-4 border-primary/20" />
                  <button className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                    <Camera className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-3 w-full">
                  <div>
                    <Label>Nome</Label>
                    <Input value={profile.name} onChange={(e) => updateProfile({ name: e.target.value })} />
                  </div>
                  <div>
                    <Label>Curso na UFU</Label>
                    <Input value={profile.course} onChange={(e) => updateProfile({ course: e.target.value })} />
                  </div>
                  <div>
                    <Label>Campus</Label>
                    <Select value={profile.campus} onValueChange={(v) => updateProfile({ campus: v as Campus })}>
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

          {/* Habits */}
          <Card>
            <CardHeader><CardTitle className="text-lg">Preferências de Hábitos</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {([
                ['organized', 'Organizado(a)'],
                ['earlyBird', 'Diurno(a)'],
                ['likesParties', 'Gosta de festas'],
                ['smokes', 'Fumante'],
                ['hasPet', 'Tem pet'],
              ] as [keyof HabitProfile, string][]).map(([key, label]) => (
                <div key={key} className="flex items-center justify-between">
                  <Label>{label}</Label>
                  <Switch checked={profile.habits[key] as boolean} onCheckedChange={(v) => updateHabit(key, v)} />
                </div>
              ))}
              <div>
                <Label>Estilo de estudo</Label>
                <Select value={profile.habits.studyHabit} onValueChange={(v) => updateHabit('studyHabit', v)}>
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
                <HabitBadges habits={profile.habits} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="foto-match" className="space-y-6 mt-4">
          <Card>
            <CardHeader><CardTitle className="text-lg">Foto para Match</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Esta foto será exibida no feed de matches. Escolha uma foto que mostre bem quem você é!
              </p>
              <div className="flex flex-col items-center gap-4">
                <div className="relative">
                  <img
                    src={profile.avatar}
                    alt="Foto para Match"
                    className="w-48 h-64 object-cover rounded-xl border-4 border-primary/20 shadow-lg"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent rounded-xl" />
                </div>
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => toast('Upload de foto em breve! 📸')}
                >
                  <Upload className="w-4 h-4" />
                  Trocar Foto de Match
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  Dica: Use uma foto sorrindo, com boa iluminação e que mostre seu rosto claramente.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Button onClick={handleSave} className="w-full" size="lg">Salvar Preferências</Button>
    </div>
  );
}
