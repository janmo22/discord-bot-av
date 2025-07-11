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
        embajadora: '1343220394039054347',
        urgencias: '1343631640441655376'
      },
      clara: {
        embajadora: '1343220395410460853',
        urgencias: '1343632895159570472'
      },
      esther: {
        embajadora: '1343220396874403927',
        urgencias: '1343635192962879559'
      },
      cristinaC: {
        embajadora: '1343220397583110282',
        urgencias: '1343635323472842752'
      },
      juanPablo: {
        embajadora: '1343220398795522150',
        urgencias: '1343635418620497931'
      },
      alba: {
        embajadora: '1343535760774791250',
        urgencias: '1343635501286166660'
      },
      angelo: {
        embajadora: '1343536834222886932',
        urgencias: '1343635706471256145'
      }
    },


    // Webhooks
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
        embajadora: '1392048227049799690'
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
      faqs: '1377914869461815296' // Canal de faqs

    },
    categoriasPorEmbajador: {},
    webhookAnalisis: process.env.N8N_WEBHOOK_URL,
    webhookFAQ: process.env.N8N_WEBHOOK_FAQ,
    webhookCanalizaciones: process.env.N8N_WEBHOOK_CANALIZACIONES
  }
};



