const puppeteer = require('puppeteer');
const GLOBAL_CONFIG = require('./config');
const Debug = require('./lib/debug');
const Steps = require('./lib/steps');
const { exec } = require("child_process");

/**
 * Текущий шаг. Переменная нужна для отправки на почту шага, на котором всё сломалось
 * @type {number}
 */
let currentStep = 0;

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function execCommand(command) {
  await exec(command, (error, stdout, stderr) => {
    if (error) {
      console.log(`error: ${error.message}`);
      return;
    }
    if (stderr) {
      console.log(`stderr: ${stderr}`);
      return;
    }
    console.log(`stdout: ${stdout}`);
  });
}

async function clearSandbox() {
  let command = "rm -rf " + process.env.PROJECT_PATH + "/* && cp bitrixsetup.php " + process.env.PROJECT_PATH + "/bitrixsetup.php";
  Debug.log('clearSandbox - ' + command);
  await execCommand(command);
  Debug.log('clearSandbox - Done');
}

async function clearDatabase(params) {
  const db = params.db;
  let sql = "echo \"drop database if exists " + db.name + "; create database " + db.name + ";\"";
  let command = sql + " > script.sql && mysql -h " + db.host + " -u " + db.login + " -p" + db.password + " < \"script.sql\"";
  Debug.log('clearDatabase - ' + command);
  await execCommand(command);
  Debug.log('clearDatabase - Done');
}

/**
 * Главная функция для запуска установки
 * @param params
 * @param isReserve
 * @returns {Promise<void>}
 */
async function setupBitrix(params, isReserve = false) {
  Debug.startDebugSession();
  Debug.log('Начало установки для сайта ' + params.domain);
  const browser = await puppeteer.launch({
    executablePath: process.env.CHROME_BIN || null,
    headless: GLOBAL_CONFIG.headlessMode,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1920,1080', '--disable-gpu']
  });
  const page = await browser.newPage();
  await page.setViewport({width: 1920, height: 1080});
  try {
    params.page = page;
    //Переходим на главную, если начинаем не с начала
    params.step != 0 && await page.goto('http://' + params.domain + '/');
    if (Array.isArray(Steps) && Steps.length)
    {
      currentStep = params.step;
      for (let i = params.step; i < Steps.length; i++) {
        Debug.log('Начался шаг #' + i);
        await Steps[i](params);
        Debug.log('Закончился шаг #' + i);
      }
    }
  } catch (e) {
    console.log("ERROR - " + e.message + ":\n" + e.stack);
    await Debug.makeScreen(page, 'error'+e.name);
    if (!isReserve)
    {
      await browser.close();
      Debug.log('ReInstall');
      await clearDatabase(params);
      await sleep(2000);
      Debug.startDebugSession();
      await clearSandbox();
      await sleep(2000);
      await setupBitrix(params, true);
      return;
    }
    await browser.close();
    Debug.log('Конец установки (с ошибками)');
    process.exit(1);
  }

  await browser.close();
  await sleep(2000);
  Debug.log('Конец установки');
}

/**
 * Обработка аргументов
 * @param args
 */
function processArguments(args) {
  const parameters = {};

  if (args.length > 0) {
    let key = '';
    for (let i = 2; i < args.length; i++) {
      let arg = args[i].split("=");
      if (arg[0].match(/^-.{1,3}$/)) {
        key = arg[0].substr(1);
        switch (key) {
          case 'd':
            key = 'domain';
            break;
          case 'ed':
            key = 'edition';
            break;
          case 'em':
            key = 'email';
            break;
          case 'p':
            key = 'password';
            break;
          case 's':
            key = 'step';
            break;
          case 'dbl':
            key = 'db_login';
            break;
          case 'dbn':
            key = 'db_name';
            break;
          case 'dbp':
            key = 'db_password';
            break;
        }
        if (!parameters[key]) {
          parameters[key] = arg[1];
        }
      }
    }
  }

  if (typeof parameters['domain'] == 'undefined') {
    throw new Error('Не верно указано доменное имя (аргумент -d) ' + parameters.toString());
  }
  if (typeof parameters['edition'] == 'undefined') {
    throw new Error('Не верно указана редакция (аргумент -ed)');
  }
  if (typeof parameters['email'] == 'undefined') {
    throw new Error('Не верно указан email администратора (аргумент -em)');
  }
  if (typeof parameters['password'] == 'undefined') {
    throw new Error('Не верно указан пароль администратора (аргумент -p)');
  }
  if (typeof parameters['db_login'] == 'undefined') {
    throw new Error('Не верно указан логин БД (аргумент -dbl)');
  }
  if (typeof parameters['db_name'] == 'undefined') {
    throw new Error('Не верно указано имя БД (аргумент -dbn)');
  }
  if (typeof parameters['db_password'] == 'undefined') {
    throw new Error('Не верно указан пароль БД (аргумент -dbp)');
  }
  if (typeof parameters['step'] == 'undefined') {
    parameters['step'] = 0;
  }

  return parameters;
}

const extParams = processArguments(process.argv);

const setupParams = {
  domain: extParams.domain,
  edition: extParams.edition,
  regInfo: {
    email: extParams.email,
    firstName: 'Intervolga',
    lastName: 'Intervolga'
  },
  adminInfo: {
    login: 'admin',
    password: extParams.password,
    email: extParams.email,
    firstName: 'admin',
    lastName: 'admin'
  },
  step: Number.parseInt(extParams.step),
  db: {
    host: 'mysql',
    login: extParams.db_login,
    name: extParams.db_name,
    password: extParams.db_password
  },
  devEmails: "egor@intervolga.ru"
};

setupBitrix(setupParams);
