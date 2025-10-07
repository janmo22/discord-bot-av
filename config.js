export const CONFIG_SERVIDORES = {
  '1343220392424247316': { // Lector Akae G10
    nombre: 'Lector Akae G10',

    // Canales fijos únicos (por nombre lógico → ID)
    canalesFijos: {
      celebracion: '1343220393543995503',
      subirMiVibra: '1343220393808498688',
      experiencias: '1343220393808498689',
      tameana: '1343220393808498690' // ✅ nuevo canal añadido
    },

    // Categorías por embajador
    categoriasPorEmbajador: {
      cristina: {
        cat_embajadora: '1343220394039054347',
        cat_urgencias: '1343631640441655376',
        canalizacion: '1343220394039054349',
        el_mar_de_dudas: '1343220394039054350',
        feedbackDupla: '1343220394039054351' // Nuevo canal para feedback de dupla
      },
      clara: {
        cat_embajadora: '1343220395410460853',
        cat_urgencias: '1343632895159570472',
        canalizacion: '1343220395972624395',
        el_mar_de_dudas: '1343220395972624396',
        feedbackDupla: '1343220395972624397' // Nuevo canal para feedback de dupla
      },
      esther: {
        cat_embajadora: '1343220396874403927',
        cat_urgencias: '1343635192962879559',
        canalizacion: '1343220396874403930',
        el_mar_de_dudas: '1343220396874403929',
        feedbackDupla: '1343220397025263758' // Nuevo canal para feedback de dupla
      },
      cristinaC: {
        cat_embajadora: '1343220397583110282',
        cat_urgencias: '1343635323472842752',
        canalizacion: '1343220397583110284',
        el_mar_de_dudas: '1343220397851807844',
        feedbackDupla: '1343220397851807845' // Nuevo canal para feedback de dupla
      },
      juanPablo: {
        cat_embajadora: '1343220398795522150',
        cat_urgencias: '1343635418620497931',
        canalizacion: '1343220398795522152',
        el_mar_de_dudas: '1343220398795522153',
        feedbackDupla: '1343220398795522154' // Nuevo canal para feedback de dupla
      },
      alba: {
        cat_embajadora: '1343535760774791250',
        cat_urgencias: '1343635501286166660',
        canalizacion: '1345074601918468147',
        el_mar_de_dudas: '1343538729234595860',
        feedbackDupla: '1343538761081815050' // Nuevo canal para feedback de dupla
      },
      angelo: {
        cat_embajadora: '1343536834222886932',
        cat_urgencias: '1343635706471256145',
        canalizacion: '1345074645866643506',
        el_mar_de_dudas: '1343539194093371432',
        feedbackDupla: '1343539228503703552' // Nuevo canal para feedback de dupla
      }
    },


    // Webhooks
    webhookAnalisis: process.env.N8N_WEBHOOK_URL,
    webhookFAQ: process.env.N8N_WEBHOOK_FAQ
  },




  '1349434394812616784': { // Servidor de G3
    nombre: 'Terapeuta Akae G3',

    // Canales fijos únicos
    canalesFijos: {
      soporte: '1424773975023685682', 
      celebracion: '1349434395005812866',     
      subirMiVibra: '1349434395165065216',
      experiencias: '1349434395165065217'
    },

    // Categorías por embajador
    categoriasPorEmbajador: {
      cristinaC: {
        cat_embajadora: '1349434395165065225',
        cat_urgencias: '1350881321970434190',
        el_mar_de_dudas: '1349434395312001175',
        feedbackDupla: '1349434395312001176' // Nuevo canal para feedback de dupla
      },
      juanPablo: {
        cat_embajadora: '1349434395165065222',
        cat_urgencias: '1350881674657009674',
        el_mar_de_dudas: '1349434395165065223',
        feedbackDupla: '1349434395165065224' // Nuevo canal para feedback de dupla
      },
      mariaA: {
        cat_embajadora: '1349434395312001177',
        cat_urgencias: '1350881556968902737',
        el_mar_de_dudas: '1349434395312001178',
        feedbackDupla: '1349434395312001179' // Nuevo canal para feedback de dupla
      }
    },


    webhookAnalisis: process.env.N8N_WEBHOOK_URL,
    webhookFAQ: process.env.N8N_WEBHOOK_FAQ
  },




  '1387738817208914043': { // Servidor de prueba
    nombre: 'Servidor de prueba',

    // Canales fijos únicos
    canalesFijos: {
      canalPrueba: '1391699561806041148',
      canalizaciones: '1392169133818253354' //canal canalizaciones
    },

    // Categorías por embajador
    categoriasPorEmbajador: {
      embajadorPrueba: {
        embajadora: '1392048227049799690'// Nuevo canal para feedback de dupla
      }
    },


    webhookAnalisis: process.env.N8N_WEBHOOK_URL,
    webhookFAQ: process.env.N8N_WEBHOOK_FAQ,
    webhookCanalizaciones: process.env.N8N_WEBHOOK_CANALIZACIONES
  },

  '1377586518310522900': {
    nombre: 'Servidor de pruebas hazloconflow',
    canalesFijos: {
      
      canalizaciones: '1392083652250439796', // Canal de canalizaciones
      faqs: '1377914869461815296', // Canal de faqs
      instagram: '1382031373484818554'

    },
    categoriasPorEmbajador: {},
    webhookAnalisis: process.env.N8N_WEBHOOK_URL,
    webhookFAQ: process.env.N8N_WEBHOOK_FAQ,
    webhookCanalizaciones: process.env.N8N_WEBHOOK_CANALIZACIONES,
    webhookInstagram: process.env.N8N_WEBHOOK_INSTA // Nuevo webhook para Instagram
  }
};



