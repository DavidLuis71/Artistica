✅ Carga de entrenamiento por sesión

(para correlacionar con cansancio)

✅ Objetivos individuales por nadadora

(muy potente para motivación)

✅ RPE (esfuerzo percibido) en sesiones

super útil para medir si el entreno está bien calibrado

CREATE TABLE public.ausencias_recurrentes (
id serial PRIMARY KEY,
nadadora_id integer NOT NULL REFERENCES public.nadadoras(id),
motivo text NOT NULL,
tipo_recurrencia text NOT NULL CHECK (tipo_recurrencia IN ('semanal', 'fecha_unica', 'rango')),
dias_semana integer[], -- solo si tipo_recurrencia = 'semanal', 0 = domingo, 1 = lunes ...
fecha_inicio date, -- para tipo 'rango' o 'fecha_unica'
fecha_fin date -- solo si tipo 'rango'
);
