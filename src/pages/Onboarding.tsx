import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { Camera, ArrowLeft, ArrowRight, Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import logoImg from '@/assets/Logo_Uhome.png';

export default function Onboarding() {
  const navigate = useNavigate();
  const { user, refreshProfile } = useAuth();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState({
    full_name: '',
    course: '',
    smokes: false,
    likesParties: false,
    hasPet: false,
    organized: true,
    earlyBird: false,
    studyHabit: 'moderado',
    searchType: 'republica',
    campus: 'Santa Mônica',
    priceRange: [400, 800] as [number, number],
  });

  const progress = (step / 3) * 100;

  const handleFinish = async () => {
    if (!user) return;
    setSaving(true);
    await supabase.from('profiles').update({
      full_name: data.full_name,
      course: data.course,
      campus: data.campus,
      search_type: data.searchType,
      price_range_min: data.priceRange[0],
      price_range_max: data.priceRange[1],
      habits: {
        smokes: data.smokes,
        likesParties: data.likesParties,
        hasPet: data.hasPet,
        organized: data.organized,
        earlyBird: data.earlyBird,
        studyHabit: data.studyHabit,
      },
    }).eq('id', user.id);
    await refreshProfile();
    setSaving(false);
    toast.success('Bem-vindo ao Uhome! 🎉');
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <img src={logoImg} alt="Uhome" className="h-12 mx-auto" />
          <h1 className="text-xl font-bold">Configure seu perfil</h1>
          <p className="text-sm text-muted-foreground">Passo {step} de 3</p>
        </div>

        <Progress value={progress} className="h-2" />

        <Card>
          <CardContent className="pt-6 space-y-4">
            {step === 1 && (
              <>
                <div className="flex justify-center">
                  <div className="w-20 h-20 rounded-full bg-accent flex items-center justify-center border-2 border-dashed border-primary/30">
                    <Camera className="w-8 h-8 text-muted-foreground" />
                  </div>
                </div>
                <div>
                  <Label>Seu nome</Label>
                  <Input value={data.full_name} onChange={(e) => setData({ ...data, full_name: e.target.value })} placeholder="Ex: Maria Silva" />
                </div>
                <div>
                  <Label>Curso na UFU</Label>
                  <Input value={data.course} onChange={(e) => setData({ ...data, course: e.target.value })} placeholder="Ex: Engenharia Elétrica" />
                </div>
              </>
            )}

            {step === 2 && (
              <>
                {([
                  ['organized', 'Sou organizado(a)'],
                  ['earlyBird', 'Sou diurno(a)'],
                  ['likesParties', 'Gosto de festas'],
                  ['smokes', 'Fumo'],
                  ['hasPet', 'Tenho pet'],
                ] as [string, string][]).map(([key, label]) => (
                  <div key={key} className="flex items-center justify-between">
                    <Label>{label}</Label>
                    <Switch checked={(data as any)[key]} onCheckedChange={(v) => setData({ ...data, [key]: v })} />
                  </div>
                ))}
                <div>
                  <Label>Estilo de estudo</Label>
                  <Select value={data.studyHabit} onValueChange={(v) => setData({ ...data, studyHabit: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="silencioso">Silencioso</SelectItem>
                      <SelectItem value="moderado">Moderado</SelectItem>
                      <SelectItem value="social">Social</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <div>
                  <Label>Tipo de busca</Label>
                  <Select value={data.searchType} onValueChange={(v) => setData({ ...data, searchType: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="quarto">Quarto individual</SelectItem>
                      <SelectItem value="republica">República</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Campus preferido</Label>
                  <Select value={data.campus} onValueChange={(v) => setData({ ...data, campus: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {['Santa Mônica', 'Umuarama', 'Pontal', 'Glória'].map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Faixa de preço: R$ {data.priceRange[0]} – R$ {data.priceRange[1]}</Label>
                  <Slider min={200} max={2500} step={50} value={data.priceRange} onValueChange={(v) => setData({ ...data, priceRange: v as [number, number] })} className="mt-2" />
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <div className="flex gap-3">
          {step > 1 && (
            <Button variant="outline" className="flex-1" onClick={() => setStep(step - 1)}>
              <ArrowLeft className="w-4 h-4 mr-1" /> Voltar
            </Button>
          )}
          {step < 3 ? (
            <Button className="flex-1" onClick={() => setStep(step + 1)}>
              Próximo <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button className="flex-1" onClick={handleFinish} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Check className="w-4 h-4 mr-1" />}
              Finalizar
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
