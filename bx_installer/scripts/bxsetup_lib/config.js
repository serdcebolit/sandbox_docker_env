const GLOBAL_CONFIG = {
  screenshotsDir: __dirname + '/screenshots/',   //Директория хранения скриншотов для отладки
  needScreenshots: true,           //Нужно ли делать скриншоты
  needLog: true,                    //Нужен ли вывод отладочной информации
  headlessMode: true,                //Нужен ли headless-режим
  editions: {
    'business': 'Бизнес',
    // 'expert': 'Эксперт',
    'small_business': 'Малый бизнес',
    'standard': 'Стандарт',
    'start': 'Старт'
  }
};

module.exports = GLOBAL_CONFIG;