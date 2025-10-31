export const CONFIG_SERVIDORES = {
  '1349434394812616784': { // Terapeuta Akae® G3
    nombre: 'Terapeuta Akae® G3',

    canalesFijos: {
      soporte: '1424773975023685682',      // 🚑-soporte (no analsis solo faqs)
      celebracion: '1349434395005812866',   // 🥳celebración
      subirmivibra: '1349434395165065216',  // 💃subir-mi-vibra
      experiencias: '1349434395165065217',  // 🚀experiencias
      whereismydupla: '1349434395165065218', // 🧐where-is-my-dupla
      revisando: '1349434395165065219',     // 🔎revisando
      foto: '1349434395165065220',          // 📷-foto
      sesionesmagicas: '1349434395165065221' // sesiones-mágicas💫
    },

    categoriasPorEmbajador: {
      juanPablo: {
        cat_embajadora: '1349434395165065222',
        //soytuembajadora: '1418068899311784036',
        //elmardedudas: '1349434395165065223',
        //feedbackdupla: '1349434395165065224'
      },
      cristinaC: {
        cat_embajadora: '1349434395165065225',
        //soytuembajadora: '1418081467120222309',
        //elmardedudas: '1349434395312001175',
        //feedbackdupla: '1349434395312001176'
      },
      mariaA: {
        cat_embajadora: '1349434395312001177',
        //soytuembajadora: '1418081517770510418',
        //elmardedudas: '1349434395312001178',
        //feedbackdupla: '1349434395312001179'
      }
    },

    webhookAnalisis: process.env.N8N_WEBHOOK_URL,
    webhookFAQ: process.env.N8N_WEBHOOK_FAQ
  },

  '1351968535580114984': { // Psika® G10
    nombre: 'Psika® G10',

    canalesFijos: {
      soporte: '1428263834023362650',        // 🚑-soporte (FAQ) (solo faqs no analisis)
      mislogros: '1351968536955977902',      // 🥳mis-logros
      subirmivibra: '1351968536955977903',   // 💃subir-mi-vibra
      experiencias: '1351968536955977904',   // 🚀experiencias
      elcasoabierto: '1351968537459167433',  // 🧐el-caso-abierto
      eljuego: '1351968537459167435',        // 🎯-el-juego
      sesionesmagicas: '1351968537459167436' // 🧚🏻sesiones-mágicas
    },

    // Categoría de prácticas (lunes-domingo)
    categoriaPracticas: '1351968537459167437',

    categoriasPorEmbajador: {
      AbgeloB_JuditB: {
        cat_embajadora: '1351968537958285409',
        //soytuembajador: '1351968540688781327',
        //elmardedudas: '1351968537958285410',
        //feedbackdupla: '1351968537958285411'
      },
      CristinaH_BarbaraP: {
        cat_embajadora: '1351968539128369226',
        //soytuembajadora: '1351968539128369227',
        //elmardedudas: '1351968539128369228',
        //feedbackdupla: '1351968539128369229'
      },
      JuanPablo_CristinaL: {
        cat_embajadora: '1351968542681202760',
        //soytuembajador: '1351968542681202761',
        //elmardedudas: '1351968542681202762',
        //feedbackdupla: '1351968542681202763'
      },
      CristinaC_InesM: {
        cat_embajadora: '1351968544551731365',
        //soytuembajadora: '1351968544551731366',
        //elmardedudas: '1351968544551731367',
        //feedbackdupla: '1351968545088733245'
      }
    },

    webhookAnalisis: process.env.N8N_WEBHOOK_URL,
    webhookFAQ: process.env.N8N_WEBHOOK_FAQ
  },

  // '1351968535580114984': { // Bhimbira 
  //   nombre: 'Bhimbira',

  //   canalesFijos: {
  //     soporte: '1428263834023362650',        // 🚑-soporte (FAQ) (solo faqs no analisis)
  //     mislogros: '1351968536955977902',      // 🥳mis-logros
  //     subirmivibra: '1351968536955977903',   // 💃subir-mi-vibra
  //     experiencias: '1351968536955977904',   // 🚀experiencias
  //     elcasoabierto: '1351968537459167433',  // 🧐el-caso-abierto
  //     eljuego: '1351968537459167435',        // 🎯-el-juego
  //     sesionesmagicas: '1351968537459167436' // 🧚🏻sesiones-mágicas
  //   },

  //   // Categoría de prácticas (lunes-domingo)
  //   categoriaPracticas: '1351968537459167437',

  //   categoriasPorEmbajador: {
  //     AbgeloB_JuditB: {
  //       cat_embajadora: '1351968537958285409',
  //       //soytuembajador: '1351968540688781327',
  //       //elmardedudas: '1351968537958285410',
  //       //feedbackdupla: '1351968537958285411'
  //     },
  //     CristinaH_BarbaraP: {
  //       cat_embajadora: '1351968539128369226',
  //       //soytuembajadora: '1351968539128369227',
  //       //elmardedudas: '1351968539128369228',
  //       //feedbackdupla: '1351968539128369229'
  //     },
  //     JuanPablo_CristinaL: {
  //       cat_embajadora: '1351968542681202760',
  //       //soytuembajador: '1351968542681202761',
  //       //elmardedudas: '1351968542681202762',
  //       //feedbackdupla: '1351968542681202763'
  //     },
  //     CristinaC_InesM: {
  //       cat_embajadora: '1351968544551731365',
  //       //soytuembajadora: '1351968544551731366',
  //       //elmardedudas: '1351968544551731367',
  //       //feedbackdupla: '1351968545088733245'
  //     }
  //   },

  //   webhookAnalisis: process.env.N8N_WEBHOOK_URL,
  //   webhookFAQ: process.env.N8N_WEBHOOK_FAQ
  // },

  // '1351968535580114984': { // Lector Akae 
  //   nombre: 'Lector Akae',

  //   canalesFijos: {
  //     soporte: '1428263834023362650',        // 🚑-soporte (FAQ) (solo faqs no analisis)
  //     mislogros: '1351968536955977902',      // 🥳mis-logros
  //     subirmivibra: '1351968536955977903',   // 💃subir-mi-vibra
  //     experiencias: '1351968536955977904',   // 🚀experiencias
  //     elcasoabierto: '1351968537459167433',  // 🧐el-caso-abierto
  //     eljuego: '1351968537459167435',        // 🎯-el-juego
  //     sesionesmagicas: '1351968537459167436' // 🧚🏻sesiones-mágicas
  //   },

  //   // Categoría de prácticas (lunes-domingo)
  //   categoriaPracticas: '1351968537459167437',

  //   categoriasPorEmbajador: {
  //     AbgeloB_JuditB: {
  //       cat_embajadora: '1351968537958285409',
  //       //soytuembajador: '1351968540688781327',
  //       //elmardedudas: '1351968537958285410',
  //       //feedbackdupla: '1351968537958285411'
  //     },
  //     CristinaH_BarbaraP: {
  //       cat_embajadora: '1351968539128369226',
  //       //soytuembajadora: '1351968539128369227',
  //       //elmardedudas: '1351968539128369228',
  //       //feedbackdupla: '1351968539128369229'
  //     },
  //     JuanPablo_CristinaL: {
  //       cat_embajadora: '1351968542681202760',
  //       //soytuembajador: '1351968542681202761',
  //       //elmardedudas: '1351968542681202762',
  //       //feedbackdupla: '1351968542681202763'
  //     },
  //     CristinaC_InesM: {
  //       cat_embajadora: '1351968544551731365',
  //       //soytuembajadora: '1351968544551731366',
  //       //elmardedudas: '1351968544551731367',
  //       //feedbackdupla: '1351968545088733245'
  //     }
  //   },

  //   webhookAnalisis: process.env.N8N_WEBHOOK_URL,
  //   webhookFAQ: process.env.N8N_WEBHOOK_FAQ
  // },




  '1387738817208914043': { // Servidor de prueba
    nombre: 'Servidor de prueba',

    canalesFijos: {
      canalPrueba: '1391699561806041148',
      canalizaciones: '1392169133818253354'
    },

    categoriasPorEmbajador: {
      embajadorPrueba: {
        embajadora: '1392048227049799690'
      }
    },

    webhookAnalisis: process.env.N8N_WEBHOOK_URL,
    webhookFAQ: process.env.N8N_WEBHOOK_FAQ,
    webhookCanalizaciones: process.env.N8N_WEBHOOK_CANALIZACIONES
  },

  '1377586518310522900': { // Servidor de pruebas hazloconflow
    nombre: 'Servidor de pruebas hazloconflow',
    
    canalesFijos: {
      canalizaciones: '1392083652250439796',
      faqs: '1377914869461815296',
      instagram: '1382031373484818554'
    },
    
    categoriasPorEmbajador: {},
    
    webhookAnalisis: process.env.N8N_WEBHOOK_URL,
    webhookFAQ: process.env.N8N_WEBHOOK_FAQ,
    webhookCanalizaciones: process.env.N8N_WEBHOOK_CANALIZACIONES,
    webhookInstagram: process.env.N8N_WEBHOOK_INSTA
  }
};




