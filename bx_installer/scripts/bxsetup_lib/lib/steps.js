const Debug = require('./debug');
const GLOBAL_CONFIG = require('../config');

const stepOne = async function (params) {
  const edition = params.edition || 'standard';
  const domain = params.domain;
  const page = params.page;
  await page.goto('http://' + domain + '/bitrixsetup.php?lang=ru');
  await page.waitFor('form[action="bitrixsetup.php?action=LOAD"]');

  await page.click('#radio_0');
  await page.waitFor(300);
  await page.select('#select_0', edition);

  await page.waitFor(300);
  await Debug.makeScreen(page, '1stepOne');

  await page.click('#download_button');
};

const stepTwo = async function (params) {
  const page = params.page;
  await page.waitFor('#bitrix_install_template', {timeout: 0});
  await Debug.makeScreen(page, '2stepTwoLoad');
  //Начало установки -- нажимаем "далее"
  await page.click('.wizard-next-button');

  await page.waitFor('#bitrix_install_template', {timeout: 0});
  await Debug.makeScreen(page, '3stepTwoInstall');
};

const stepThree = async function (params) {
  const page = params.page;
  const regInfo = params.regInfo;
  //Лицензионное соглашение -- жмём чекбокс на лицензионку
  await page.click('#agree_license_id');
  await page.waitFor(100);
  //Лицензионное соглашение -- жмём "далее"
  await page.click('.wizard-next-button');

  await page.waitFor('#bitrix_install_template', {timeout: 0});

  await Debug.makeScreen(page, '4stepThreeRegisterStart');
  //Регистрация продукта -- вводим данные
  await page.evaluate( (value) => document.querySelector('#user_name').value = value, regInfo.firstName);
  await page.evaluate( (value) => document.querySelector('#user_surname').value = value, regInfo.lastName);
  await page.evaluate( (value) => document.querySelector('#email').value = value, regInfo.email);
  await Debug.makeScreen(page, '5stepThreeRegisterEnd');
  await page.waitFor(100);
  //Регистрация продукта -- жмём "далее"
  await page.click('.wizard-next-button');
  await page.waitFor(1500);
  await Debug.makeScreen(page, '6stepThreeStartDistribInstall');
  //Предварительная проверка -- жмём "далее"
  await page.click('.wizard-next-button');
};

const stepFour = async function (params) {
  const page = params.page;
  const db = params.db;
  await Debug.makeScreen(page, '7stepFourPerOneDbInitStart');

  await page.waitFor('#bitrix_install_template', {timeout: 0});

  await Debug.makeScreen(page, '8stepFourRegisterStart');
  //Создание базы данных -- жмём чекбокс "Пользователь базы данных" = "Существующий" - на всякий случай
  await page.click('#create_user_N');
  await page.waitFor(100);
  //Создание базы данных -- жмём чекбокс "База данных" = "Существующая" - на всякий случай
  await page.click('#create_db_N');
  await page.waitFor(100);
  //Очистить поля перед вводом
  await page.evaluate( (value) => document.querySelector('[name="__wiz_host"]').value = value, db.host);
  await page.evaluate( (value) => document.querySelector('[name="__wiz_user"]').value = value, db.login);
  await page.evaluate( (value) => document.querySelector('[name="__wiz_password"]').value = value, db.password);
  await page.evaluate( (value) => document.querySelector('[name="__wiz_database"]').value = value, db.name);
  //Создание базы данных -- заполняем поля с данными о бд
  await Debug.makeScreen(page, '9stepFourRegisterEnd');
  await page.waitFor(100);
  //Создание базы данных -- жмём "далее"
  await page.click('.wizard-next-button');
}

const stepFive = async function (params) {
  //Установка продукта -- зацикливаемся в ожидании окончания установки
  const page = params.page;
  try {
    await page.waitFor('#bitrix_install_template [name="__wiz_login"]');
  } catch (e) {
    await Debug.makeScreen(page, '10stepFiveStartDistribInstall');
    await stepFive(params);
  }
};

const stepSix = async function (params) {
  const page = params.page;
  const adminInfo = params.adminInfo;
  await Debug.makeScreen(page, '11stepSixAdminRegisterStart');

  //Создание администратора -- вводим и подтверждаем пароль. Остальные данные заполнены и подходят
  // await page.evaluate( (value) => document.querySelector('[name="__wiz_login"]').value = value, adminInfo.login);
  await page.evaluate( (value) => document.querySelector('[name="__wiz_admin_password"]').value = value, adminInfo.password);
  await page.evaluate( (value) => document.querySelector('[name="__wiz_admin_password_confirm"]').value = value, adminInfo.password);
  // await page.evaluate( (value) => document.querySelector('[name="__wiz_email"]').value = value, adminInfo.email);
  // await page.evaluate( (value) => document.querySelector('[name="__wiz_user_name"]').value = value, adminInfo.firstName);
  // await page.evaluate( (value) => document.querySelector('[name="__wiz_user_surname"]').value = value, adminInfo.lastName);

  await Debug.makeScreen(page, '12stepSixAdminRegisterEnd');

  await page.waitFor(100);
  //Создание администратора -- жмём "далее"
  await page.click('.wizard-next-button');
  await page.waitFor('#bitrix_install_template');
  await page.waitFor(1500);
  await Debug.makeScreen(page, '13stepSixStartSelectTemplate');
};

const stepSeven = async function (params) {
  const page = params.page;
  const domain = params.domain;
  await page.waitFor('#bitrix_install_template [name="CurrentStepID"][value="select_wizard"]');
  //Выберите решение для установки -- выбираем "Демо-сайт для разработчиков"
  await page.click('[id="id_radio_bitrix:demo"]');
  await page.waitFor(300);
  await Debug.makeScreen(page, '14stepSevenStartSelectTemplate');
  //Выберите решение для установки -- жмём "далее"
  await page.click('.wizard-next-button');

  await page.waitFor(300);
  await Debug.makeScreen(page, '15stepSevenStartSelectTemplate');
  try {
    await page.waitFor('input[name="CurrentStepID"][value="__welcome"]');
  } catch {
    await page.goto('http://' + domain + '/');
    await page.waitFor('input[name="CurrentStepID"][value="__welcome"]');
  }
  await Debug.makeScreen(page, '16stepSeven');

  //Подтверждаем действие во всплывающем окне в обработчике
  page.on('dialog', async dialog => {
    dialog.accept();
  });

  await page.click('input[name="StepCancel"]');

  await page.waitFor(1000);
  await page.click('.wizard-cancel-button');
  await page.waitFor(5000);
};

const Steps = [
  stepOne,
  stepTwo,
  stepThree,
  stepFour,
  stepFive,
  stepSix,
  stepSeven
];

module.exports = Steps;
