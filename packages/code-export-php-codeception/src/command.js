// Licensed to the Software Freedom Conservancy (SFC) under one
// or more contributor license agreements.  See the NOTICE file
// distributed with this work for additional information
// regarding copyright ownership.  The SFC licenses this file
// to you under the Apache License, Version 2.0 (the
// "License"); you may not use this file except in compliance
// with the License.  You may obtain a copy of the License at
//
//   http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing,
// software distributed under the License is distributed on an
// "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
// KIND, either express or implied.  See the License for the
// specific language governing permissions and limitations
// under the License.

import { codeExport as exporter } from '@seleniumhq/side-utils'
import location from './location'
import selection from './selection'

export const emitters = {
  addSelection: emitSelect,
  answerOnNextPrompt: skip,
  assert: emitAssert,
  assertAlert: emitAssertAlert,
  assertChecked: emitVerifyChecked,
  assertConfirmation: emitAssertAlert,
  assertEditable: emitVerifyEditable,
  assertElementPresent: emitVerifyElementPresent,
  assertElementNotPresent: emitVerifyElementNotPresent,
  assertNotChecked: emitVerifyNotChecked,
  assertNotEditable: emitVerifyNotEditable,
  assertNotSelectedValue: emitVerifyNotSelectedValue,
  assertNotText: emitVerifyNotText,
  assertPrompt: emitAssertAlert,
  assertSelectedLabel: emitVerifySelectedLabel,
  assertSelectedValue: emitVerifyValue,
  assertValue: emitVerifyValue,
  assertText: emitVerifyText,
  assertTitle: emitVerifyTitle,
  check: emitCheck,
  chooseCancelOnNextConfirmation: skip,
  chooseCancelOnNextPrompt: skip,
  chooseOkOnNextConfirmation: skip,
  click: emitClick,
  clickAt: emitClick,
  close: emitClose,
  debugger: skip,
  do: emitControlFlowDo,
  doubleClick: emitDoubleClick,
  doubleClickAt: emitDoubleClick,
  dragAndDropToObject: emitDragAndDrop,
  echo: emitEcho,
  editContent: emitEditContent,
  else: emitControlFlowElse,
  elseIf: emitControlFlowElseIf,
  end: emitControlFlowEnd,
  executeScript: emitExecuteScript,
  executeAsyncScript: emitExecuteAsyncScript,
  forEach: emitControlFlowForEach,
  if: emitControlFlowIf,
  mouseDown: emitMouseDown,
  mouseDownAt: emitMouseDown,
  mouseMove: emitMouseMove,
  mouseMoveAt: emitMouseMoveAt,
  mouseOver: emitMouseMove,
  mouseOut: emitMouseOut,
  mouseUp: emitMouseUp,
  mouseUpAt: emitMouseUp,
  open: emitOpen,
  pause: emitPause,
  repeatIf: emitControlFlowRepeatIf,
  run: emitRun,
  runScript: emitRunScript,
  select: emitSelect,
  removeSelection: emitRemoveSelection,
  selectFrame: emitSelectFrame,
  selectWindow: emitSelectWindow,
  sendKeys: emitSendKeys,
  setSpeed: emitSetSpeed,
  setWindowSize: emitSetWindowSize,
  store: emitStore,
  storeAttribute: emitStoreAttribute,
  storeJson: emitStoreJson,
  storeText: emitStoreText,
  storeTitle: emitStoreTitle,
  storeValue: emitStoreValue,
  storeWindowHandle: emitStoreWindowHandle,
  storeXpathCount: emitStoreXpathCount,
  submit: emitSubmit,
  times: emitControlFlowTimes,
  type: emitType,
  uncheck: emitUncheck,
  verify: emitAssert,
  verifyChecked: emitVerifyChecked,
  verifyEditable: emitVerifyEditable,
  verifyElementPresent: emitVerifyElementPresent,
  verifyElementNotPresent: emitVerifyElementNotPresent,
  verifyNotChecked: emitVerifyNotChecked,
  verifyNotEditable: emitVerifyNotEditable,
  verifyNotSelectedValue: emitVerifyNotSelectedValue,
  verifyNotText: emitVerifyNotText,
  verifySelectedLabel: emitVerifySelectedLabel,
  verifySelectedValue: emitVerifyValue,
  verifyText: emitVerifyText,
  verifyTitle: emitVerifyTitle,
  verifyValue: emitVerifyValue,
  waitForElementEditable: emitWaitForElementEditable,
  waitForElementPresent: emitWaitForElementPresent,
  waitForElementVisible: emitWaitForElementVisible,
  waitForElementNotEditable: emitWaitForElementNotEditable,
  waitForElementNotPresent: emitWaitForElementNotPresent,
  waitForElementNotVisible: emitWaitForElementNotVisible,
  webdriverAnswerOnVisiblePrompt: emitAnswerOnNextPrompt,
  waitForText: emitWaitForText,
  webdriverChooseCancelOnVisibleConfirmation: emitChooseCancelOnNextConfirmation,
  webdriverChooseCancelOnVisiblePrompt: emitChooseCancelOnNextConfirmation,
  webdriverChooseOkOnVisibleConfirmation: emitChooseOkOnNextConfirmation,
  while: emitControlFlowWhile,
}

exporter.register.preprocessors(emitters)

function register(command, emitter) {
  exporter.register.emitter({ command, emitter, emitters })
}

function emit(command) {
  return exporter.emit.command(command, emitters[command.command], {
    variableLookup,
    emitNewWindowHandling,
  })
}

function canEmit(commandName) {
  return !!emitters[commandName]
}

function variableLookup(varName) {
  return `$${varName}`
}

function variableSetter(varName, value) {
  return varName ? `$${varName} = ${value}` : ''
}

function emitWaitForWindow() {
  const generateMethodDeclaration = name => {
    return {
      body: `async function ${name}(timeout = 2) {`,
      terminatingKeyword: '}',
    }
  }
  const commands = [
    { level: 0, statement: 'await driver.sleep(timeout)' },
    { level: 0, statement: 'const handlesThen = vars["windowHandles"]' },
    {
      level: 0,
      statement: 'const handlesNow = await driver.getAllWindowHandles()',
    },
    { level: 0, statement: 'if (handlesNow.length > handlesThen.length) {' },
    {
      level: 1,
      statement:
        'return handlesNow.find(handle => (!handlesThen.includes(handle)))',
    },
    { level: 0, statement: '}' },
    {
      level: 0,
      statement: 'throw new Error("New window did not appear before timeout")',
    },
  ]
  return Promise.resolve({
    name: 'waitForWindow',
    commands,
    generateMethodDeclaration,
  })
}

async function emitNewWindowHandling(command, emittedCommand) {
  return Promise.resolve(
    `vars["windowHandles"] = await driver.getAllWindowHandles()\n${await emittedCommand}\nvars["${
      command.windowHandleName
    }"] = await waitForWindow(${command.windowTimeout})`
  )
}

function emitAssert(varName, value) {
  return Promise.resolve(`$I->assertEquals($${varName}, ${value});`)
}

async function emitAssertAlert(alertText) {
  return Promise.resolve(
    await codeception('assertAlert', null, `"${alertText}"`)
  )
}

async function emitAnswerOnNextPrompt(textToSend) {
  let response = await codeception('answerOnNextPrompt', null, `"${textToSend}"`);
  response += await codeception('chooseOkOnNextConfirmation')
  return Promise.resolve(response);
}

async function emitCheck(target) {
  return Promise.resolve(await codeception('check', target))
}

async function emitChooseCancelOnNextConfirmation() {
  return Promise.resolve(await codeception('chooseCancelOnNextConfirmation'))
}

async function emitChooseOkOnNextConfirmation() {
  return Promise.resolve(await codeception('chooseOkOnNextConfirmation'))
}

async function emitClick(target) {
  return Promise.resolve(await codeception('click', target))
}

async function emitClose() {
  return Promise.resolve(`$this->getModule('WebDriver')->_closeSession();`)
}

async function generateExpressionScript(script) {
  return Promise.resolve(
    `$I->executeJS("return ${script.script}"${generateScriptArguments(script)})`
  )
}

function generateScriptArguments(script) {
  return `${script.argv.length ? ', ' : ''}${
    script.argv
      .map(varName => `$${varName}`)
      .join(',')}`
}

function emitControlFlowDo() {
  return Promise.resolve({
    commands: [{ level: 0, statement: 'do {' }],
    endingLevelAdjustment: 1,
  })
}

function emitControlFlowElse() {
  return Promise.resolve({
    commands: [{ level: 0, statement: '} else {' }],
    startingLevelAdjustment: -1,
    endingLevelAdjustment: +1,
  })
}

async function emitControlFlowElseIf(script) {
  return Promise.resolve({
    commands: [
      {
        level: 0,
        statement: `} else if (${await generateExpressionScript(script)}) {`,
      },
    ],
    startingLevelAdjustment: -1,
    endingLevelAdjustment: +1,
  })
}

function emitControlFlowEnd() {
  return Promise.resolve({
    commands: [{ level: 0, statement: `}` }],
    startingLevelAdjustment: -1,
  })
}

async function emitControlFlowIf(script) {
  return Promise.resolve({
    commands: [
      { level: 0, statement: `if (${await generateExpressionScript(script)}) {` },
    ],
    endingLevelAdjustment: 1,
  })
}

function emitControlFlowForEach(collectionVarName, iteratorVarName) {
  return Promise.resolve({
    commands: [
      {
        level: 0,
        statement: `$collection = $${collectionVarName};`,
      },
      {
        level: 0,
        statement: `for ($i = 0; $i < sizeof($collection); $i++) {`,
      },
      {
        level: 1,
        statement: `$${iteratorVarName} = $${collectionVarName};`,
      },
    ],
  })
}

async function emitControlFlowRepeatIf(script) {
  return Promise.resolve({
    commands: [
      {
        level: 0,
        statement: `} while(${await generateExpressionScript(script)});`,
      },
    ],
    startingLevelAdjustment: -1,
  })
}

function emitControlFlowTimes(target) {
  const commands = [
    {
      level: 0,
      statement: `$times = ${target};`,
    },
    {
      level: 0,
      statement: `for($i = 0; i < sizeof($times); $i++) {`,
    },
  ]
  return Promise.resolve({ commands, endingLevelAdjustment: 1 })
}

async function emitControlFlowWhile(script) {
  return Promise.resolve({
    commands: [
      { level: 0, statement: `while(${await generateExpressionScript(script)}) {` },
    ],
    endingLevelAdjustment: 1,
  })
}

async function emitDoubleClick(target) {
  return Promise.resolve(await codeception('doubleClick', target));
}

async function emitDragAndDrop(dragged, dropped) {
  dragged = await location.emit(dragged);
  dropped = await location.emit(dropped);
  return Promise.resolve(`$I->dragAndDrop(${dragged}, ${dropped});`);
}

async function emitEcho(message) {
  const _message = message.startsWith('$') ? message : `"${message}"`
  return Promise.resolve(`print(${_message});`)
}

async function emitEditContent(locator, content) {
  const commands = [
    { level: 0, statement: `{` },
    {
      level: 1,
      statement: `$element = $webdriver->findElement(${await location.emit(
        locator
      )})`,
    },
    {
      level: 1,
      statement: `$webdriver->executeScript("if(arguments[0].contentEditable === 'true') {arguments[0].innerText = '${content}'}", $element)`,
    },
    { level: 0, statement: `}` },
  ]
  return Promise.resolve({ commands })
}

async function emitExecuteScript(script, varName) {
  const scriptString = script.script.replace(/`/g, '\\`')
  console.log(script);
  return Promise.resolve(
    variableSetter(varName, await codeception('runScript', null, `"${scriptString}"${generateScriptArguments(
    script
  )}`)))
}

async function emitExecuteAsyncScript(script, varName) {
  const result = `$I->executeAsyncJS("var callback = arguments[arguments.length - 1];${
    script.script
  }.then(callback).catch(callback);${generateScriptArguments(script)}")`
  return Promise.resolve(variableSetter(varName, result))
}

async function emitMouseDown(locator) {
  const loc = await location.emit(locator);
  return Promise.resolve(selenium(`
    $coordinates = $webdriver->findElement(${loc})->getCoordinates();
    $webdriver->getMouse()->mouseDown($coordinates);
  `))
}

async function emitMouseMove(locator) {
  return Promise.resolve(codeception('mouseMove', locator))
}
async function emitMouseMoveAt(locator, value) {
  return Promise.resolve(codeception('mouseMove', locator, null, value))
}
async function emitMouseOut() {
  return Promise.resolve(`$I->moveMouseTo("body", 0, 0);`)
}

async function emitMouseUp(locator) {
  const loc = await location.emit(locator);
  return Promise.resolve(selenium(`
    $coordinates = $webdriver->findElement(${loc})->getCoordinates();
    $webdriver->getMouse()->mouseUp($coordinates);
  `))
}

async function emitOpen(target) {
  console.log(target);
  const url = /^(file|http|https):\/\//.test(target);
  if(url) {
    console.log('a');
    return Promise.resolve(await codeception('openUrl', null, `"${target}"`))
  }
  else{
    return Promise.resolve(await codeception('openPage', null, `"${target}"`))
  }
}

async function emitPause(time) {
  return Promise.resolve( await codeception('pause', null, time));
}

async function emitRun(testName) {
  return Promise.resolve(`${exporter.parsers.sanitizeName(testName)}()`)
}

async function emitRunScript(script) {
  return Promise.resolve(
    codeception('runScript', null, `"${script.script}${generateScriptArguments(script)}"`)
  )
}

async function emitSetWindowSize(size) {
  const [width, height] = size.split('x')
  return Promise.resolve(
    `$I->resizeWindow(${width}, ${height});`
  )
}

async function emitSelect(selectElement, option) {
  const options = option.split('=');
  return Promise.resolve( await codeception('select', selectElement, `"${options[1]}"`))
}
async function emitRemoveSelection(selectElement, option) {
  const options = option.split('=');
  return Promise.resolve( await codeception('removeSelection', selectElement, `"${options[1]}"`))
}

async function emitSelectFrame(frameLocation) {
  if (frameLocation === 'relative=top' || frameLocation === 'relative=parent') {
    return Promise.resolve(selenium(`
      $webdriver->switchTo()->defaultContent();
    `))
  } else if (/^index=/.test(frameLocation)) {
    const frame = Math.floor(frameLocation.split('index=')[1]);
    return Promise.resolve(selenium(`
      $webdriver->switchTo()->frame(${frame});
    `))
  } else {
    const loc = location.emit(frameLocation)
    return Promise.resolve(selenum(`
       $element = $webdriver->findElement(${loc});
       $webdriver->switchTo()->frame($element);
    `))
  }
}

async function emitSelectWindow(windowLocation) {
  if (/^handle=/.test(windowLocation)) {
    return Promise.resolve(
      `await driver.switchTo().window(${windowLocation.split('handle=')[1]})`
    )
  } else if (/^name=/.test(windowLocation)) {
    return Promise.resolve(
      `await driver.switchTo().window("${windowLocation.split('name=')[1]}")`
    )
  } else if (/^win_ser_/.test(windowLocation)) {
    if (windowLocation === 'win_ser_local') {
      return Promise.resolve({
        commands: [
          {
            level: 0,
            statement:
              'await driver.switchTo().window(await driver.getAllWindowHandles()[0])',
          },
        ],
      })
    } else {
      const index = parseInt(windowLocation.substr('win_ser_'.length))
      return Promise.resolve({
        commands: [
          {
            level: 0,
            statement: `await driver.switchTo().window(await driver.getAllWindowHandles()[${index}])`,
          },
        ],
      })
    }
  } else {
    return Promise.reject(
      new Error('Can only emit `select window` using handles')
    )
  }
}

function generateSendKeysInput(value) {
  if (typeof value === 'object') {
    return value
      .map(s => {
        if (s.startsWith('$')) {
          return s
        } else if (s.startsWith('Key[')) {
          const key = s.match(/\['(.*)'\]/)[1]
          return `'\\Facebook\\WebDriver\\WebDriverKeys::${key}'`
        } else {
          return `"${s}"`
        }
      })
      .join(', ')
  } else {
    if (value.startsWith('vars[')) {
      return value
    } else {
      return `"${value}"`
    }
  }
}

async function emitSendKeys(target, value) {
  const keys = generateSendKeysInput(value);
  return Promise.resolve(codeception('type', target, keys))
}

function emitSetSpeed() {
  return Promise.resolve(
    'print("`set speed` is a no-op in code export, use `pause` instead");'
  )
}

async function emitStore(value, varName) {
  return Promise.resolve(variableSetter(varName, `"${value}";`))
}

async function emitStoreAttribute(locator, varName) {
  const attributePos = locator.lastIndexOf('@')
  const elementLocator = locator.slice(0, attributePos)
  const attributeName = locator.slice(attributePos + 1)
  const commands = [
    { level: 0, statement: `{` },
    {
      level: 1,
      statement: `const attribute = await driver.findElement(${await location.emit(
        elementLocator
      )}).getAttribute("${attributeName}")`,
    },
    { level: 1, statement: `${variableSetter(varName, 'attribute')}` },
    { level: 0, statement: `}` },
  ]
  return Promise.resolve({ commands })
}

async function emitStoreJson(json, varName) {
  return Promise.resolve(variableSetter(varName, `json_decode('${json}');`))
}

async function emitStoreText(locator, varName) {
  return Promise.resolve(variableSetter(varName, await codeception('storeText',locator)))
}

async function emitStoreTitle(_, varName) {
  return Promise.resolve(variableSetter(varName, await codeception('storeText', 'xpath=//title')))
}

async function emitStoreValue(locator, varName) {
  return Promise.resolve(variableSetter(varName, await codeception('storeValue', locator)))
}

async function emitStoreWindowHandle(varName) {
  return Promise.resolve(
    variableSetter(varName, 'await driver.getWindowHandle()')
  )
}

async function emitStoreXpathCount(locator, varName) {
  const result = `await driver.findElements(${await location.emit(
    locator
  )}).length`
  return Promise.resolve(variableSetter(varName, result))
}

async function emitSubmit(_locator) {
  return Promise.resolve(
    await codeception('click', _locator)
  )
}

async function emitType(target, value) {
  return Promise.resolve(await codeception('type', target, `"${value}"`))
}

async function emitUncheck(locator) {
  return Promise.resolve(await codeception('uncheck', locator));
}

async function emitVerifyChecked(locator) {
  return Promise.resolve(await codeception('verifyChecked', locator));
}

async function emitVerifyEditable(locator) {
  const loc = await location.emit(locator);
  return Promise.resolve(selenium(`
    $webdriver->findElement(${loc})->isEnabled();
  `))
}

async function emitVerifyElementPresent(locator) {
  return Promise.resolve(await codeception('verifyElementPresent', locator))
}

async function emitVerifyElementNotPresent(locator) {
  return Promise.resolve(await codeception('verifyElementNotPresent', locator))
}

async function emitVerifyNotChecked(locator) {
  return Promise.resolve(await codeception('verifyNotChecked', locator));
}

async function emitVerifyNotEditable(locator) {
  const loc = await location.emit(locator);
  return Promise.resolve(selenium(`
    !$webdriver->findElement(${loc})->isEnabled();
  `))
}

async function emitVerifyNotSelectedValue(locator, expectedValue) {
  return Promise.resolve(await codeception('verifyNotSelectedValue',locator, expectedValue))
}

async function emitVerifyNotText(locator, text) {
  return Promise.resolve(await codeception('verifyNotText', locator, text, true))
}

async function emitVerifySelectedLabel(locator, labelValue) {
  return Promise.resolve(await codeception('verifySelectedLabel',locator, `"${labelValue}"`))
}

async function emitVerifyText(locator, text) {
  return Promise.resolve(await codeception('verifyText', locator, text, true))
}

async function emitVerifyValue(locator, value) {
  return Promise.resolve(await codeception('verifyValue', locator, `"${value}"`))
}

async function emitVerifyTitle(title) {
  return Promise.resolve(await codeception('verifyTitle', null, `"${title}"`));
}

function skip() {
  return Promise.resolve(undefined)
}

async function emitWaitForElementPresent(locator, timeout) {
  return Promise.resolve(
    `await driver.wait(until.elementLocated(${await location.emit(
      locator
    )}), ${Math.floor(timeout)})`
  )
}

async function emitWaitForElementNotPresent(locator, timeout) {
  return Promise.resolve(
    `await driver.wait(until.stalenessOf(await driver.findElement(${await location.emit(
      locator
    )})), ${Math.floor(timeout)})`
  )
}

async function emitWaitForElementVisible(locator, timeout) {
  return Promise.resolve(
    await codeception('waitForElementVisible', locator, `${Math.floor(timeout)}`)
  )
}

async function emitWaitForElementNotVisible(locator, timeout) {
  return Promise.resolve(
    await codeception('waitForElementNotVisible', locator, `${Math.floor(timeout)}`)
  )
}

async function emitWaitForElementEditable(locator, timeout) {
  const loc = await location.emit(locator);
  const time = Math.floor(timeout);
  return Promise.resolve(selenium(`
    $webdriver->wait(${time})->until($webdriver->findElement(${loc})->isEnabled());
  `))
}
// $driver->wait(10, 1000)->until(
//   WebDriverExpectedCondition::visibilityOfElementLocated(WebDriverBy::id('first_name'))
// );
async function emitWaitForElementNotEditable(locator, timeout) {
  return Promise.resolve(
    `await driver.wait(until.elementIsDisabled(await driver.findElement(${await location.emit(
      locator
    )})), ${Math.floor(timeout)})`
  )
}

async function emitWaitForText(locator, text) {
  const timeout = 30000
  return Promise.resolve(
    await codeception('waitForText', locator, text, `${Math.floor(timeout)}`)
    //probably need to pass in locator
  )
}

export default {
  canEmit,
  emit,
  register,
  extras: { emitWaitForWindow },
}


const codeceptionMap = {
  'click': 'click',
  'type' : 'fillField',
  'check': 'checkOption',
  'doubleClick': 'doubleClick',
  'pause': 'wait',
  'select': 'selectOption',
  'openUrl': 'amOnUrl',
  'openPage': 'amOnPage',
  'runScript': 'executeJS',
  'uncheck': 'uncheckOption',
  'executeAsyncScript': 'executeAsyncJS',
  'verifyChecked': 'seeCheckboxIsChecked',
  'verifyNotChecked': 'dontSeeCheckboxIsChecked',
  'storeText': 'grabTextFrom',
  'storeValue': 'grabValueFrom',
  'submit': 'click',
  'verifyTitle': 'seeInTitle',
  'verifyValue': 'seeInField',
  'waitForElementVisible': 'waitForElementVisible',
  'waitForElementNotVisible': 'waitForElementNotVisible',
  'waitForText': 'waitForText',
  'verifyText': 'see',
  'chooseOkOnNextConfirmation': 'acceptPopup',
  'chooseCancelOnNextConfirmation': 'cancelPopup',
  'answerOnNextPrompt': 'typeInPopup',
  'assertAlert': 'seeInPopup',
  'removeSelection': 'unselectOption',
  'verifyElementPresent': 'seeElementInDOM',
  'verifyElementNotPresent': 'dontSeeElementInDOM',
  'verifyNotSelectedValue': 'dontSeeInField',
  'verifySelectedLabel': 'seeInField',
  'verifyNotText': 'dontSee',
  'mouseMove': 'moveMouseOver'

};

// Specials:
// emitDragAndDrop

async function codeception(command=null, locator=null, value=null, flipLocationAndValue =false){
  const cCommand = codeceptionMap[command];
  if(!locator && !value)
  {
    return `$I->${cCommand}();`;
  }
  if(!locator)
  {
    return `$I->${cCommand}(${value});`
  }
  else {
    const loc = await location.emit(locator);
    if (value) {
      if(flipLocationAndValue) {
        return `$I->${cCommand}("${value}", ${loc});`
      } else {
        return `$I->${cCommand}(${loc}, ${value});`
      }
    } else {
      return `$I->${cCommand}(${loc});`
    }
  }
}
function selenium(code){
  return `$I->executeInSelenium(function (\\Facebook\\WebDriver\\Remote\\RemoteWebDriver $webdriver) {
    ${code}
  });`
}
