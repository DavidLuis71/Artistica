export interface Pregunta {
  id: number;
  texto: string;
  opciones: string[];
  correcta: string;
  imagen?: string; // URL opcional de la imagen
}

// Array de ejemplo, puedes añadir todas las preguntas que quieras
export const preguntasTrivial: Pregunta[] = [
  {
    id: 1,
    texto: "¿Cuál es la posición básica de natación artística?",
    opciones: ["Barracuda", "Vertical", "Plancha", "Estrella"],
    correcta: "Plancha",
  },
  {
    id: 2,
    texto: "¿Cuánto dura una rutina de equipo en competición?",
    opciones: ["3 min", "4 min", "2 min, 30 segundos", "2 min"],
    correcta: "3 min",
  },
  {
    id: 3,
    texto: "¿Qué posición es?",
    opciones: ["Plancha", "Carpa", "Cola de pez", "Caballero"],
    correcta: "Caballero",
    imagen:
      "https://ntblpxsamoavksjxomke.supabase.co/storage/v1/object/public/cartas-diarias/rara/caballero.png", // ruta local o URL
  },
  {
    id: 4,
    texto: "¿Qué posición es?",
    opciones: [
      "Pierna de ballet doble submarina",
      "Carpa",
      "Carpa submarina",
      "Flamenco",
    ],
    correcta: "Pierna de ballet doble submarina",
    imagen:
      "https://ntblpxsamoavksjxomke.supabase.co/storage/v1/object/public/cartas-diarias/rara/ballet_doble_submarina.png", // ruta local o URL
  },
  {
    id: 5,
    texto: "¿Qué posición es?",
    opciones: ["I", "Grua", "Y", "Cola de pez"],
    correcta: "Y",
    imagen:
      "https://ntblpxsamoavksjxomke.supabase.co/storage/v1/object/public/cartas-diarias/epica/y.png",
  },

  {
    id: 6,
    texto: "¿En qué figura se utiliza esta posición?",
    opciones: ["Barracuda", "Paseo de frente", "Marsopa", "Londres"],
    correcta: "Paseo de frente",
    imagen:
      "https://ntblpxsamoavksjxomke.supabase.co/storage/v1/object/public/cartas-diarias/legendaria/arqueado.png", // ruta local o URL
  },
  {
    id: 7,
    texto: "¿Qué posición es?",
    opciones: [
      "Vertical rodilla doblada",
      "Barracuda espagat",
      "Flamenco",
      "Pierna de ballet",
    ],
    correcta: "Vertical rodilla doblada",
    imagen:
      "https://ntblpxsamoavksjxomke.supabase.co/storage/v1/object/public/cartas-diarias/rara/vertical_doblada.png",
  },
  {
    id: 8,
    texto: "¿Qué significa un 'porte' en natación artística?",
    opciones: [
      "Levantar a otra nadadora del agua",
      "Girar sobre uno mismo",
      "Mantener la respiración bajo el agua",
      "Mover los brazos sincronizados",
    ],
    correcta: "Levantar a otra nadadora del agua",
  },
  {
    id: 9,
    texto: "¿Se puede tocar las paredes o el suelo durante la rutina?",
    opciones: [
      "Sí, se puede usar para impulsarse",
      "No, salvo que sea un accidente y no se use para impulsarse",
      "Sí, solo si no te ven",
      "No, nunca en ninguna circunstancia",
    ],
    correcta: "No, salvo que sea un accidente y no se use para impulsarse",
  },
  {
    id: 10,
    texto:
      "En una rutina de equipo, ¿Cuantas nadadoras minimas tiene que haber?",
    opciones: ["8", "5", "3", "4"],
    correcta: "4",
  },
  {
    id: 11,
    texto: "¿La remada americana se usa en qué figura?",
    opciones: ["Barracuda", "Marsopa", "Pierna de ballet ", "Flamenco"],
    correcta: "Marsopa",
  },
  {
    id: 12,
    texto:
      "¿Qué parte del cuerpo se utiliza principalmente para mantener la vertical en el agua?",
    opciones: ["Piernas", "Brazos", "Abdomen", "Espalda"],
    correcta: "Brazos",
  },

  {
    id: 13,
    texto: "¿Qué elemento no forma parte de la puntuación de una rutina?",
    opciones: [
      "Dificultad",
      "Impresion artística",
      "Velocidad de nado",
      "Sincronización",
    ],
    correcta: "Velocidad de nado",
  },
  {
    id: 14,
    texto: "¿Cómo se tiene que hacer la figura Pierna de ballet?",
    opciones: [
      "Lo más rápido posible",
      "Lo más despacio posible",
      "Despacio aunque este hundida",
      "Rapido para no hundirme",
    ],
    correcta: "Despacio aunque este hundida",
  },
  {
    id: 15,
    texto: "¿Es importante el recorrido durante una coreografía?",
    opciones: [
      "Si, ya que hay que pasar por al menos la mitad de la piscina",
      "No, ya que lo que importa es la coreografía",
      "Si, ya que hay que recorrer las cuatro esquinas",
      "No, con terminar en el centro ya valdría",
    ],
    correcta: "Si, ya que hay que recorrer las cuatro esquinas",
  },
  {
    id: 16,
    texto: "¿Qué son los niveles en natación artística?",
    opciones: [
      "Pruebas oficiales que permiten acceder a campeonatos de España",
      "Categorías según la edad de las nadadoras",
      "Distintas alturas de la piscina",
      "La cantidad de figuras que debe realizar cada nadadora",
    ],
    correcta: "Pruebas oficiales que permiten acceder a campeonatos de España",
  },
  {
    id: 17,
    texto: "¿Por qué se cuenta en 8 durante la natación artística?",
    opciones: [
      "Para marcar el ritmo de la música y la coreografía",
      "Para coordinar los movimientos de piernas solamente",
      "Porque la rutina dura 8 minutos",
      "Para recordar la secuencia de figuras",
    ],
    correcta: "Para marcar el ritmo de la música y la coreografía",
  },
  {
    id: 18,
    texto: "¿Qué posición se utiliza para entrar a hacer una marsopa?",
    opciones: ["Carpa", "Barracuda", "Plancha", "Vertical"],
    correcta: "Carpa",
  },
  {
    id: 19,
    texto:
      "¿Cuál de estas figuras es considerada difícil en natación artística?",
    opciones: ["I", "Grua", "Y", "Plancha"],
    correcta: "Grua",
  },
  {
    id: 20,
    texto:
      "¿Qué pasa si una nadadora toca el fondo de la piscina durante la rutina?",
    opciones: [
      "Se penaliza con puntos",
      "Se permite si nadie lo ve",
      "No pasa nada",
      "Se reinicia la rutina",
    ],
    correcta: "Se penaliza con puntos",
  },
  {
    id: 21,
    texto:
      "Según el reglamento, ¿cuántos chicos como máximo puede tener un equipo en una rutina de equipo sin que sea mixto?",
    opciones: ["0", "1", "2", "3"],
    correcta: "2",
  },
  {
    id: 22,
    texto:
      "¿Qué remada se utiliza para avanzar con fuerza en la rutina sin romper la vertical?",
    opciones: ["Asimetrica", "Batidora", "Molino de agua", "Americana"],
    correcta: "Americana",
  },
  {
    id: 23,
    texto:
      "¿Qué remada se utiliza para entrar desde plancha a la posición carpa?",
    opciones: ["Asimetrica", "Perrito", "Molino de agua", "Americana"],
    correcta: "Molino de agua",
  },
  {
    id: 24,
    texto: "La bolita se realiza...",
    opciones: [
      "Con las rodillas encima de la cadera",
      "Rodillas al pecho y la cabeza hacia el fondo",
      "Los tobillos tienen que estar tocando los gluteos",
      "En vertical, con las piernas flexionadas por las rodillas.",
    ],
    correcta: "Rodillas al pecho y la cabeza hacia el fondo",
  },
  {
    id: 25,
    texto:
      "¿Cuál de estas figuras requiere que la nadadora esté boca abajo y con las piernas juntas estiradas hacia arriba?",
    opciones: ["Flamenco", "Marsopa", "Vertical rodilla doblada", "Carpa"],
    correcta: "Marsopa",
  },
  {
    id: 26,
    texto:
      "Durante una coreografía, ¿qué es más importante además de realizar las figuras correctamente?",
    opciones: [
      "Sincronización con la música y compañeras",
      "Nadar rápido",
      "Hacer la figura más alta posible",
      "Mirar al público",
    ],
    correcta: "Sincronización con la música y compañeras",
  },
  {
    id: 27,
    texto: "¿Qué remada se utiliza para salir de la posición de arqueada?",
    opciones: ["Asimetrica", "Torpedo", "Molino de agua", "Americana"],
    correcta: "Torpedo",
  },
  {
    id: 28,
    texto:
      "Para mantener la sincronización durante la rutina, las nadadoras deben:",
    opciones: [
      "Mirar siempre al público",
      "Contar mentalmente los tiempos de la música",
      "Hacer la figura más rápido",
      "Ignorar a las compañeras",
    ],
    correcta: "Contar mentalmente los tiempos de la música",
  },
  {
    id: 29,
    texto: "La figura 'Pierna de ballet' se mantiene...",
    opciones: [
      "Rápida y vertical",
      "Despacio y controlada",
      "Solo con una pierna",
      "No importa la velocidad",
    ],
    correcta: "Despacio y controlada",
  },
  {
    id: 30,
    texto:
      "Durante la rutina, ¿por qué es importante mantener la formación del equipo?",
    opciones: [
      "Para que el público lo vea bonito",
      "Para que el juez pueda puntuar correctamente",
      "No importa, cada una hace lo que quiera",
      "Solo para las fotos",
    ],
    correcta: "Para que el juez pueda puntuar correctamente",
  },
  {
    id: 31,
    texto: "¿Qué se debe respetar al hacer una transición entre figuras?",
    opciones: [
      "La misma posición de inicio y fin",
      "El ritmo de la música",
      "La distancia con las compañeras",
      "Todas las anteriores",
    ],
    correcta: "Todas las anteriores",
  },
  {
    id: 32,
    texto: "En la coreografía, ¿qué significa 'respetar el recorrido'?",
    opciones: [
      "Pasar por todas las esquinas y zonas establecidas",
      "Hacer todas las figuras en el mismo lugar",
      "Nadar rápido sin pararse",
      "Ignorar la formación",
    ],
    correcta: "Pasar por todas las esquinas y zonas establecidas",
  },
  {
    id: 33,
    texto:
      "Si una nadadora se desincroniza durante la rutina, ¿qué debe hacer?",
    opciones: [
      "Ignorar y seguir su ritmo",
      "Intentar volver a sincronizarse con el equipo",
      "Detener la rutina",
      "Cambiar de posición con otra nadadora",
    ],
    correcta: "Intentar volver a sincronizarse con el equipo",
  },
  {
    id: 34,
    texto:
      "En la rutina, cuando una figura dura varios segundos, ¿cómo se aseguran las nadadoras de mantenerse sincronizadas?",
    opciones: [
      "Contando la musica internamente",
      "Cada una hace la figura a su propio ritmo",
      "El entrenador las guía desde fuera de la piscina con gritos",
      "No importa la sincronización en figuras largas",
    ],
    correcta: "Contando la musica internamente",
  },
  {
    id: 35,
    texto:
      "En una competicion de figuras , si una figura se realiza con errores de postura o falta de control, ¿cómo afecta a la puntuación?",
    opciones: [
      "Se resta puntos por mala ejecución",
      "No afecta mientras la figura se complete",
      "Se gana un punto extra por esfuerzo",
      "Se repite la figura sin penalización",
    ],
    correcta: "Se resta puntos por mala ejecución",
  },
  {
    id: 36,
    texto:
      "En una competicion de figuras, la nadadora ¿Cuando empieza a ejecutar la figura?",
    opciones: [
      "Cuando piense que ya está colocada",
      "Cuando la juez del medio se lo indique",
      "En cuanto llegue frente a los jueces",
      "No hay un momento concreto",
    ],
    correcta: "Cuando la juez del medio se lo indique",
  },
  {
    id: 37,
    texto:
      "¿Por qué en competiciones de figuras individuales todas las nadadoras suelen llevar bañador negro y gorro blanco?",
    opciones: [
      "Para que los jueces puedan ver mejor la forma del cuerpo y los movimientos",
      "Porque es la moda en natación artística",
      "Para que coincida con los colores del equipo organizador",
      "Para que los jueces no sepan quién es quién y la puntuación se vea involucrada",
    ],
    correcta:
      "Para que los jueces no sepan quién es quién y la puntuación se vea involucrada",
  },
  //nuevas
  {
    id: 38,
    texto: "¿Cuál es el error más común en la figura carpa?",
    opciones: [
      "Doblar las rodillas",
      "Sacar demasiada pierna del agua",
      "Tener la espalda redondeada",
      "Mover los brazos rápido",
    ],
    correcta: "Tener la espalda redondeada",
  },
  {
    id: 39,
    texto: "Para mantener una figura alta, ¿qué deben hacer las nadadoras?",
    opciones: [
      "Mover los brazos muy despacio pero fuerte",
      "Controlar la remada y el core",
      "Respirar constantemente",
      "Flexionar ligeramente las rodillas",
    ],
    correcta: "Controlar la remada y el core",
  },
  {
    id: 40,
    texto: "¿Cuál es el objetivo principal de la entrada de carpa?",
    opciones: [
      "Subir rápido a vertical",
      "Mantener la espalda recta",
      "Aumentar la altura del cuerpo",
      "Preparar la posición para una figura",
    ],
    correcta: "Preparar la posición para una figura",
  },
  {
    id: 41,
    texto: "¿Cuantas pruebas se pueden suspender en las pruebas de Niveles?",
    opciones: [
      "1 prueba por segmento ( natacion, figuras, seco )",
      "1 prueba en total",
      "Puedo no hacer 1 prueba y suspender 1 prueba",
      "Tengo que aprobar todas las pruebas",
    ],
    correcta: "1 prueba en total",
  },
  {
    id: 42,
    texto: "¿Que remada hay que usar para entrar o salir de un paseo?",
    opciones: ["Americana", "Molino de agua", "Aritmetica", "Asimetrica"],
    correcta: "Asimetrica",
  },
  {
    id: 43,
    texto: "Al realizar la batidora de lado, ¿qué brazo debe levantarse?",
    opciones: [
      "El brazo derecho",
      "El brazo que queda atrás durante el movimiento",
      "El brazo que queda adelante durante el movimiento",
      "Da igual",
    ],
    correcta: "El brazo que queda atrás durante el movimiento",
  },
  {
    id: 44,
    texto:
      "Desde la Posición Estirada de Espalda, las piernas se elevan a la vertical a la vez que se sumerge el cuerpo hasta la Posición Carpa de Espalda con el nivel del agua justo por encima de los dedos de los pies. Se ejecuta un Empuje hasta la Posición Vertical. Se ejecuta un Descenso Vertical al mismo ritmo que el Empuje. ¿Qué figura es?",
    opciones: ["Marsopa", "Barracuda", "Flamenco", "Blossom"],
    correcta: "Barracuda",
  },
  {
    id: 45,
    texto: "A la hora de entrenar, ¿qué es lo más importante?",
    opciones: [
      "Hacer todo lo que te digan los entrenadores sin cuestionarlo y sin saber para que se hacen.",
      "Intentar esforzarse al máximo, repetir los ejercicios para mejorar aunque ya salgan bien,prestar atencion a la técnica disfrutar cada sesión y aprovechar el tiempo.",
      "Hacer solo los ejercicios que te resulten fáciles y rápidos, sin repetirlos demasiado.",
      "Entrenar lo justo para cumplir, sin prestar atención a la técnica ni al aprendizaje.",
    ],
    correcta:
      "Intentar esforzarse al máximo, repetir los ejercicios para mejorar aunque ya salgan bien,prestar atencion a la técnica disfrutar cada sesión y aprovechar el tiempo.",
  },
  {
    id: 46,
    texto: "Al aprender una nueva figura, ¿qué es más importante?",
    opciones: [
      "Intentar hacerla rápido, aunque la técnica no sea correcta.",
      "Observar, practicar despacio, corregir los errores y repetir hasta perfeccionarla.",
      "Ver cómo lo hacen las demás y copiar sin practicar mucho.",
      "Solo practicarla una vez y pasar a la siguiente figura.",
    ],
    correcta:
      "Observar, practicar despacio, corregir los errores y repetir hasta perfeccionarla",
  },
  {
    id: 47,
    texto: "Cuando practicas una figura difícil, ¿cómo debes afrontarla?",
    opciones: [
      "Intentando hacerlo rápido aunque falle varias veces.",
      "Dividirla en pasos, practicar despacio y corregir cada error.",
      "Solo observar al entrenador y no intentar nada.",
      "Repetirla haciendo siempre lo mismo, intentando que alguna vez salga bien.",
    ],
    correcta: "Dividirla en pasos, practicar despacio y corregir cada error",
  },
  {
    id: 48,
    texto: "Durante una rutina en equipo, lo más importante es:",
    opciones: [
      "Destacar individualmente aunque desincronices al grupo.",
      "Mantener la formación, la sincronización y apoyar a las compañeras.",
      "Nadar rápido y sin mirar la música.",
      "Hacer solo las figuras que más te gustan.",
    ],
    correcta:
      "Mantener la formación, la sincronización y apoyar a las compañeras",
  },
  {
    id: 49,
    texto:
      "¿Cuál es la mejor manera de mejorar la flexibilidad en natación artística?",
    opciones: [
      "Estirando de vez en cuando antes de dormir.",
      "Realizando ejercicios de estiramiento específicos y constantes durante la semana.",
      "Solo estirando cuando duele algo.",
      "Ignorando la flexibilidad, que no es importante.",
    ],
    correcta:
      "Realizando ejercicios de estiramiento específicos y constantes durante la semana.",
  },
  {
    id: 50,
    texto:
      "Si una figura no sale bien en tu primera práctica, ¿qué debes hacer?",
    opciones: [
      "Dejar de practicarla, ya nunca saldrá.",
      "Repetirla, corregir los errores y seguir practicando hasta mejorar.",
      "Hacer otra figura más fácil.",
      "Culpar a las compañeras o al entrenador.",
    ],
    correcta:
      "Repetirla, corregir los errores y seguir practicando hasta mejorar",
  },
  {
    id: 51,
    texto:
      "Cuando haces una coreografía, ¿qué es más importante además de las figuras?",
    opciones: [
      "Mantener la sonrisa y disfrutar de la rutina.",
      "Nadar lo más rápido posible.",
      "Mirar al público constantemente.",
      "Ignorar la música y hacer solo movimientos.",
    ],
    correcta: "Mantener la sonrisa y disfrutar de la rutina",
  },
  {
    id: 52,
    texto: "Durante la preparación física, lo más importante es:",
    opciones: [
      "Solo hacer los ejercicios que más te gustan.",
      "Seguir el plan, esforzarte, mantener constancia y cuidar la técnica.",
      "Hacer los ejercicios rápido y sin descanso.",
      "Evitar los ejercicios difíciles para no cansarte.",
    ],
    correcta:
      "Seguir el plan, esforzarte, mantener constancia y cuidar la técnica",
  },
  {
    id: 53,
    texto: "Si cometes un error durante la rutina en competición, lo mejor es:",
    opciones: [
      "Detenerte y empezar de nuevo.",
      "Seguir adelante, mantener la concentración y completar la rutina.",
      "Mirar a tus compañeras para que lo corrijan por ti.",
      "Rendirse y salir de la piscina.",
    ],
    correcta:
      "Seguir adelante, mantener la concentración y completar la rutina",
  },
  {
    id: 54,
    texto: "¿Dónde se gana realmente la medalla?",
    opciones: [
      "En la competición, cuando todo el mundo te ve.",
      "En los entrenamientos, practicando y mejorando día a día.",
      "Cuando las compañeras te aplauden.",
      "No importa, solo cuenta la suerte.",
    ],
    correcta: "En los entrenamientos, practicando y mejorando día a día",
  },
  {
    id: 55,
    texto: "Si quieres mejorar tu rutina, lo más importante es:",
    opciones: [
      "Esperar a la competición para ver si funciona.",
      "Dedicar tiempo a entrenar, repetir y corregir errores antes de competir.",
      "Hacerla solo cuando te sientes motivada.",
      "Ver a otras nadadoras y copiar lo que hacen.",
    ],
    correcta:
      "Dedicar tiempo a entrenar, repetir y corregir errores antes de competir",
  },
  {
    id: 56,
    texto:
      "Si tu figura sale perfecta en competición sin haberla practicado, ¿significa que ya eres excelente?",
    opciones: [
      "Sí, eso demuestra talento natural.",
      "No, la constancia y la práctica diaria son lo que realmente forma a un buen nadador.",
      "Depende del público y los jueces.",
      "Solo importa la suerte del día.",
    ],
    correcta:
      "No, la constancia y la práctica diaria son lo que realmente forma a un buen nadador",
  },
  {
    id: 57,
    texto: "¿Cuál es la clave para un buen resultado en competición?",
    opciones: [
      "Improvisar durante la rutina y esperar que salga bien.",
      "Entrenar con esfuerzo, repetir, corregir y aprender constantemente.",
      "Solo enfocarte en que parezca que lo haces bien.",
      "Hacer la rutina más fácil para no fallar.",
    ],
    correcta:
      "Entrenar con esfuerzo, repetir, corregir y aprender constantemente",
  },
  {
    id: 58,
    texto: "Si una figura no te sale perfecta hoy, ¿qué debes pensar?",
    opciones: [
      "Que nunca la vas a conseguir.",
      "Que es una oportunidad para aprender y mejorar en el entrenamiento.",
      "Que es demasiado dificil para mi.",
      "Que los jueces no la puntuarán.",
    ],
    correcta:
      "Que es una oportunidad para aprender y mejorar en el entrenamiento",
  },
  {
    id: 59,
    texto:
      "¿Es importante avisar si vas a llegar tarde al entrenamiento o si vas a faltar?",
    opciones: [
      "Sí, porque afecta al equipo y a tu propio progreso.",
      "No, no es necesario.",
      "Sí, pero da igual cuando lo hagas.",
      "No, porque los entrenadores no necesitan saberlo.",
    ],
    correcta: "Sí, porque afecta al equipo y a tu propio progreso.",
  },
  {
    id: 60,
    texto:
      "Si llegas tarde al entrenamiento, ¿qué estás afectando principalmente?",
    opciones: [
      "Solo a ti misma, no pasa nada.",
      "Al equipo y a tu propio progreso, perdiendo tiempo valioso.",
      "A los entrenadores, pero no al equipo.",
      "Nada, puedes compensarlo después.",
    ],
    correcta: "Al equipo y a tu propio progreso, perdiendo tiempo valioso",
  },
  {
    id: 61,
    texto:
      "Si tu compañera necesita ayuda para una figura durante el entrenamiento, ¿qué deberías hacer?",
    opciones: [
      "Ignorarla y concentrarte solo en tu rutina.",
      "Ayudarla y trabajar juntas para mejorar, porque el equipo depende de todas.",
      "Decirle que lo intente sola.",
      "Esperar a que el entrenador intervenga.",
    ],
    correcta:
      "Ayudarla y trabajar juntas para mejorar, porque el equipo depende de todas",
  },
  {
    id: 62,
    texto: "El compromiso con el equipo significa:",
    opciones: [
      "Solo hacer tu parte cuando te apetece.",
      "Asistir a los entrenamientos, esforzarte y apoyar a tus compañeras.",
      "Solo aparecer en los días de competición.",
      "Que los demás hagan tu trabajo por ti.",
    ],
    correcta:
      "Asistir a los entrenamientos, esforzarte y apoyar a tus compañeras",
  },
  {
    id: 63,
    texto:
      "Si una nadadora rompe la formación durante una rutina de equipo, ¿qué sucede?",
    opciones: [
      "No pasa nada, cada una hace lo que quiere.",
      "Se pierde sincronización y puede afectar la puntuación de todas.",
      "Solo afecta a quien se movió, no al equipo.",
      "Los jueces no lo notan.",
    ],
    correcta: "Se pierde sincronización y puede afectar la puntuación de todas",
  },
  {
    id: 64,
    texto: "Para que el equipo funcione, cada miembro debe:",
    opciones: [
      "Cuidar su propio rendimiento.",
      "Ser puntual, responsable, apoyar a las demás y dar lo mejor en cada entrenamiento.",
      "Intentar destacar y no fijarse en las demás.",
      "Solo competir bien los días de competición.",
    ],
    correcta:
      "Ser puntual, responsable, apoyar a las demás y dar lo mejor en cada entrenamiento",
  },
  {
    id: 65,
    texto:
      "Cuando no obtienes los resultados que esperabas, lo más importante es:",
    opciones: [
      "Dejar de esforzarte y conformarte.",
      "Mantener la constancia, aprender de los errores y seguir intentando.",
      "Culpar a tus compañeras o al entrenador.",
      "Compararte con las demás y desanimarte.",
    ],
    correcta:
      "Mantener la constancia, aprender de los errores y seguir intentando",
  },
  {
    id: 66,
    texto: "¿Cuál es la clave para mejorar en natación artística?",
    opciones: [
      "Solo entrenar duro las semanas  de competición.",
      "Entrenar con actitud positiva, esforzándose y disfrutando cada sesión.",
      "Hacer los ejercicios lo más rápido posible sin concentración.",
      "Depender del talento natural, no del esfuerzo.",
    ],
    correcta:
      "Entrenar con actitud positiva, esforzándose y disfrutando cada sesión",
  },
  {
    id: 67,
    texto:
      "Si una rutina sale mal en un entrenamiento, ¿cómo debes reaccionar?",
    opciones: [
      "Desanimarte y dejar de intentarlo.",
      "Analizar qué salió mal, corregirlo y seguir practicando con motivación.",
      "Culpar al equipo y no entrenar más ese día.",
      "Hacerla otra vez sin cambiar nada.",
    ],
    correcta:
      "Analizar qué salió mal, corregirlo y seguir practicando con motivación",
  },
  {
    id: 68,
    texto: "La motivación durante el entrenamiento se mantiene mejor si:",
    opciones: [
      "Solo te concentras en el resultado final de la competición.",
      "Te marcas objetivos pequeños, disfrutas del proceso y celebras los avances.",
      "Ignoras tus errores y solo repites los ejercicios.",
      "Dependes del ánimo del entrenador o del equipo.",
    ],
    correcta:
      "Te marcas objetivos pequeños, disfrutas del proceso y celebras los avances",
  },
  {
    id: 69,
    texto:
      "Si ves que una compañera se siente mal por comentarios o actitudes, ¿qué deberías hacer?",
    opciones: [
      "Ignorarla y no meterme en sus problemas.",
      "Apoyarla, hablar con ella y avisar al entrenador si hace falta.",
      "Reírme también para no quedarme atrás.",
      "Decirle que aguante porque así es la vida.",
    ],
    correcta: "Apoyarla, hablar con ella y avisar al entrenador si hace falta",
  },
  {
    id: 70,
    texto:
      "Alguien hace gestos o burlas hacia otra nadadora, ¿cómo deberías reaccionar?",
    opciones: [
      "Participar en la burla para no sentirme excluida.",
      "Ignorarlo y quedarme callada.",
      "Decir que eso no está bien y ayudar a que se respete a todos.",
      "Publicar algo en redes para vengarme.",
    ],
    correcta: "Decir que eso no está bien y ayudar a que se respete a todos",
  },
  {
    id: 71,
    texto:
      "Si alguien no quiere entrenar contigo porque piensa que no eres buena, ¿qué deberías hacer?",
    opciones: [
      "Dejar de entrenar porque es inútil.",
      "Seguir esforzándote, demostrar tu actitud y pedir apoyo si hace falta.",
      "Ignorar el problema y entrenar sola sin decir nada.",
      "Molestar a esa persona para vengarte.",
    ],
    correcta:
      "Seguir esforzándote, demostrar tu actitud y pedir apoyo si hace falta",
  },
  {
    id: 72,
    texto:
      "Una compañera hace comentarios negativos sobre tu esfuerzo, ¿qué actitud es la correcta?",
    opciones: [
      "Ignorarlo y mantener tu motivación, trabajando con respeto.",
      "Responder con insultos y gestos malos.",
      "Dejar de entrenar porque te sientes mal.",
      "Difundir los comentarios entre otras personas.",
    ],
    correcta: "Ignorarlo y mantener tu motivación, trabajando con respeto",
  },
  {
    id: 73,
    texto:
      "Si alguien hace bullying o acoso hacia otra nadadora, ¿cuál es la mejor acción?",
    opciones: [
      "Reírme y no involucrarme.",
      "Apoyar a la víctima, hablar con ella y con un entrenador.",
      "Unirme a la burla para no ser el siguiente.",
      "Ignorarlo porque no es asunto mío.",
    ],
    correcta: "Apoyar a la víctima, hablar con ella y con un entrenador",
  },
  {
    id: 74,
    texto:
      "Si el entrenador te corrige varias veces en un entrenamiento, ¿cómo deberías tomarlo?",
    opciones: [
      "Enfadarte y no hacer caso, porque te están criticando demasiado.",
      "Tomarlo como una oportunidad para mejorar y concentrarte en lo que te dice.",
      "Pensar que solo te corrige a ti porque no eres buena.",
      "Ignorar las correcciones y hacer lo que quieras.",
    ],
    correcta:
      "Tomarlo como una oportunidad para mejorar y concentrarte en lo que te dice",
  },
  {
    id: 75,
    texto:
      "Cuando notas que recibes más correcciones que tus compañeras, ¿qué es lo correcto?",
    opciones: [
      "Sentirte mal y compararte con ellas.",
      "Entender que el entrenador quiere que mejores y usarlo para esforzarte más.",
      "Decidir entrenar menos porque es injusto.",
      "Molestarte y hablar mal del entrenador.",
    ],
    correcta:
      "Entender que el entrenador quiere que mejores y usarlo para esforzarte más",
  },
  {
    id: 76,
    texto:
      "Si durante un entrenamiento te corrigen continuamente, ¿cuál es la actitud adecuada?",
    opciones: [
      "Resistirte y hacer todo a tu manera.",
      "Escuchar con atención, preguntar dudas y aplicar los consejos para mejorar.",
      "Enfadarte y no entrenar bien.",
      "Quejarte frente a tus compañeras para quejarte del entrenador.",
    ],
    correcta:
      "Escuchar con atención, preguntar dudas y aplicar los consejos para mejorar",
  },
  {
    id: 77,
    texto: "Recibir muchas correcciones puede ser señal de que:",
    opciones: [
      "El entrenador te odia y no le caes bien.",
      "Es una oportunidad para aprender, mejorar y superar tus límites.",
      "Tus compañeras son mejores y tú no sirves.",
      "Es aburrido y no sirve para nada.",
    ],
    correcta: "Es una oportunidad para aprender, mejorar y superar tus límites",
  },
  {
    id: 78,
    texto:
      "En una rutina, ¿qué elemento ayuda a que el público entienda mejor la historia o temática?",
    opciones: [
      "Las figuras obligatorias",
      "La expresividad y la interpretación",
      "La velocidad",
      "Los silencios",
    ],
    correcta: "La expresividad y la interpretación",
  },
  {
    id: 79,
    texto: "¿Qué es fundamental al practicar una remada nueva?",
    opciones: [
      "Hacerla rápido para cansarse menos",
      "Mirar el agua para ver la mano",
      "Controlar la muñeca y la presión del agua",
      "Mover solo el hombro",
    ],
    correcta: "Controlar la muñeca y la presión del agua",
  },
  {
    id: 80,
    texto:
      "¿Qué actitud demuestra una nadadora comprometida durante el entrenamiento?",
    opciones: [
      "Se concentra, escucha y corrige lo que le indican",
      "Habla durante las explicaciones",
      "Hace solo lo que le gusta",
      "Hace los ejercicios sin ganas",
    ],
    correcta: "Se concentra, escucha y corrige lo que le indican",
  },
  {
    id: 81,
    texto: "Para mejorar tu resistencia en el agua debes:",
    opciones: [
      "Evitar cansarte",
      "Ser constante y mantener el ritmo aunque sea duro",
      "Nadar solo cuando te apetezca",
      "Descansar cada vez que te cueste",
    ],
    correcta: "Ser constante y mantener el ritmo aunque sea duro",
  },
  {
    id: 82,
    texto: "¿Qué es fundamental antes de empezar a entrenar?",
    opciones: [
      "Calentar bien para evitar lesiones",
      "Entrar directamente al agua",
      "Hablar con las compañeras",
      "Estirar solo al final",
    ],
    correcta: "Calentar bien para evitar lesiones",
  },
  {
    id: 83,
    texto:
      "Si la entrenadora está explicando algo importante, ¿qué debes hacer?",
    opciones: [
      "Escuchar en silencio y mirar la explicación",
      "Seguir hablando con las compañeras",
      "Mirar el agua mientras explica",
      "Practicar otra cosa por tu cuenta",
    ],
    correcta: "Escuchar en silencio y mirar la explicación",
  },
  {
    id: 84,
    texto: "¿Qué es más importante durante una sesión de entrenamiento?",
    opciones: [
      "Hacer muchos ejercicios sin técnica",
      "La calidad de cada repetición",
      "Terminar rápido la sesión",
      "Evitar corregir errores",
    ],
    correcta: "La calidad de cada repetición",
  },
  {
    id: 85,
    texto: "¿Cuál es una buena señal de un entrenamiento productivo?",
    opciones: [
      "Terminar igual que como empezaste",
      "Salir cansada pero satisfecha con tus progresos",
      "No sudar",
      "No corregir nada",
    ],
    correcta: "Salir cansada pero satisfecha con tus progresos",
  },
  {
    id: 86,
    texto: "Para mejorar la fuerza necesaria en las figuras, es importante:",
    opciones: [
      "Trabajar el core y la remada en seco y en agua",
      "Solo practicar figuras",
      "Hacer solo piernas",
      "No hacer preparación física",
    ],
    correcta: "Trabajar el core y la remada en seco y en agua",
  },
  {
    id: 87,
    texto: "Si sientes que te estás cansando mucho, lo correcto es:",
    opciones: [
      "Rendirte y parar",
      "Seguir con buena técnica y avisar si no puedes más",
      "Forzarte hasta lesionarte",
      "Salir del agua sin decir nada",
    ],
    correcta: "Seguir con buena técnica y avisar si no puedes más",
  },
  {
    id: 88,
    texto: "¿Qué significa entrenar con intención?",
    opciones: [
      "Hacer los ejercicios rápido",
      "Acabar el ejercicio lo antes posible para poder hacer más",
      "Pasar el rato",
      "Hacer cada ejercicio con concentración y objetivo",
    ],
    correcta: "Hacer cada ejercicio con concentración y objetivo",
  },
  {
    id: 89,
    texto: "Si una corrección te la repiten varias veces, lo adecuado es:",
    opciones: [
      "Ignorarla",
      "Molestarte",
      "Poner más atención e intentar aplicarla conscientemente",
      "Evitar ese ejercicio",
    ],
    correcta: "Poner más atención e intentar aplicarla conscientemente",
  },
  {
    id: 90,
    texto: "Al terminar un entreno, lo ideal es:",
    opciones: [
      "Salir corriendo sin estirar",
      "Hacer estiramientos para recuperar mejor",
      "Irte sin despedirte",
      "Seguir practicando sin control",
    ],
    correcta: "Hacer estiramientos para recuperar mejor",
  },
  {
    id: 91,
    texto: "¿Qué ayuda a evitar lesiones durante la temporada?",
    opciones: [
      "No calentar",
      "Tener buena técnica, estirar y escuchar al cuerpo",
      "Entrenar solo cuando se quiera",
      "Hacer siempre lo mismo",
    ],
    correcta: "Tener buena técnica, estirar y escuchar al cuerpo",
  },
  {
    id: 92,
    texto: "Para aprender una coreografía nueva, lo mejor es:",
    opciones: [
      "Memorizar pasos sin entenderlos",
      "Escuchar, mirar, repetir despacio y preguntar dudas",
      "Solo mirar a las compañeras",
      "Intentar hacer el mayor numero de ochos que pueda",
    ],
    correcta: "Escuchar, mirar, repetir despacio y preguntar dudas",
  },
  {
    id: 93,
    texto: "Cuando el entrenador te corrige, significa que:",
    opciones: [
      "Lo estás haciendo mal siempre",
      "Quiere ayudarte a mejorar",
      "Va en contra de ti",
      "Quiere que te canses",
    ],
    correcta: "Quiere ayudarte a mejorar",
  },
  {
    id: 94,
    texto: "¿Qué hábito mejora muchísimo el rendimiento en entrenamientos?",
    opciones: [
      "Dormir poco y comer rápido",
      "Dormir bien, hidratarse y mantener energía",
      "No comer antes de entrenar",
      "Entrenar solo un día a la semana",
    ],
    correcta: "Dormir bien, hidratarse y mantener energía",
  },
];

//añadir el texto que sea la descripcin de una figura y 4 posibles figuras para que sepan como se hace cada figura
