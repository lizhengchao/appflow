/*------------------------------------------------------------------------------
 * NAME    : Evaluator.js
 * PURPOSE : Expression Evaluator
 * AUTHOR  : Prasad P. Khandekar
 * CREATED : August 21, 2005 Unary Minus = 0xAD
 *------------------------------------------------------------------------------
 * Copyright (c) 2005. Khan Information Systems. All Rights Reserved
 * The contents of this file are subject to the KIS Public License 1.0
 * (the "License"); you may not use this file except in compliance with the 
 * License. You should have received a copy of the KIS Public License along with 
 * this library; if not, please ask your software vendor to provide one.
 * 
 * YOU AGREE THAT THE PROGRAM IS PROVIDED AS-IS, WITHOUT WARRANTY OF ANY KIND
 * (EITHER EXPRESS OR IMPLIED) INCLUDING, WITHOUT LIMITATION, ANY IMPLIED 
 * WARRANTY OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE, AND ANY 
 * WARRANTY OF NON INFRINGEMENT. IN NO EVENT SHALL THE CONTRIBUTORS BE LIABLE FOR
 * ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; 
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON 
 * ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT 
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THE 
 * PROGRAM, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *
 * See the License for the specific language governing rights and limitations 
 * under the License.
 *-----------------------------------------------------------------------------*/
var UNARY_NEG    = "�";
var ARG_TERMINAL = "�";
var LESS_THAN    = "�";
var GREATER_THAN = "�";
var NOT_EQUAL    = "�";
var DEBUG_ON     = false;
var NUMARIC_OP   = "*,/,%,^";

function Expression(pstrExp)
{
	var strInFix = null;
	var arrVars = null;
    var arrTokens = null;
    var arrPostFix = null;
    var dtFormat = "dd/MM/yyyy";

	this.DateFormat = SetDateFormat;
	this.Expression = SetExpression;
    this.Parse = ParseExpression;
    this.Evaluate = EvaluateExpression;
    this.AddVariable = AddNewVariable;
    this.Reset = ClearAll;

	function SetDateFormat(pstrFmt)
	{
	    dtFormat = pstrFmt;
	}

	function SetExpression(pstrExp)
	{
		strInFix = pstrExp;
	}

	function AddNewVariable(varName, varValue)
	{
	    if (arrVars == null || arrVars == undefined)
	        arrVars = new Array();
		arrVars[varName] = varValue;
	}

	function ClearAll()
	{
		arrVars = null;
		strInFix = null;
		arrTokens = null;
		arrPostFix = null;
	}

	function ParseExpression()
	{
    	arrTokens = Tokanize(strInFix);
    	if (arrTokens == null || arrTokens == undefined)
    	    throw "Unable to tokanize the expression!";
    	if (arrTokens.length <= 0)
    	    throw "Unable to tokanize the expression!";

    	arrPostFix = InFixToPostFix(arrTokens);
    	if (arrPostFix == null || arrPostFix == undefined)
    	    throw "Unable to convert the expression to postfix form!";
    	if (arrPostFix.length <= 0)
    	    throw "Unable to convert the expression to postfix form!";
    	return arrPostFix.toString();
	}

	function getVariable(strVarName)
	{
	    var retVal;

		debugAssert(strVarName);
	    if (arrVars == null || arrVars == undefined)
	        throw "Variable values are not supplied!";

		retVal = arrVars[strVarName];
        if (retVal == undefined || retVal == null)
            throw "Variable [" + strVarName + "] not defined";

        debugAssert(strVarName + " - " + retVal);
        return retVal;
	}

	// postfix function evaluator
	function EvaluateExpression()
	{
	    var intIndex;
	    var myStack;
	    var strTok, strOp;
	    var objOp1, objOp2, objTmp1, objTmp2;
	    var dblNo, dblVal1, dblVal2;
	    var parrExp;

	    if (arrPostFix == null || arrPostFix == undefined)
	        ParseExpression();
	    if (arrPostFix.length == 0)
	        throw "Unable to parse the expression!";

	    parrExp = arrPostFix;
	    if (parrExp == null || parrExp == undefined)
	    {
	        throw "Invalid postfix expression!";
	        return;
	    }
	    if (parrExp.length == 0)
	    {
	        throw "Invalid postfix expression!";
	        return;
	    }

	    intIndex = 0;
	    myStack  =  new Stack();
	    while (intIndex < parrExp.length)
	    {
	        strTok = parrExp[intIndex];
	        switch (strTok)
	        {
	            case ARG_TERMINAL :
	                myStack.Push(strTok);
	                break;
	            case UNARY_NEG :
	                if (myStack.IsEmpty())
	                    throw "No operand to negate!";

	                objOp1 = null;
	                objOp2 = null;
	                objOp1 = myStack.Pop();
	                if (IsVariable(objOp1))
	                    objOp1 = getVariable(objOp1);

	                dblNo = ToNumber(objOp1);
	                if (isNaN(dblNo))
	                    throw "Not a numaric value!";
	                else
	                {
	                    dblNo = (0 - dblNo);
	                    myStack.Push(dblNo);
	                }
	                break;
	            case "!" :
	                if (myStack.IsEmpty())
	                    throw "No operand on stack!";

	                objOp1 = null;
	                objOp2 = null;
	                objOp1 = myStack.Pop();
	                if (IsVariable(objOp1))
	                    objOp1 = getVariable(objOp1);

	                objOp1 = ToBoolean(objOp1);
	                if (objOp1 == null)
	                    throw "Not a boolean value!";
	                else
	                    myStack.Push(!objOp1);
	                break;
	            case "*" :
	            case "/" :
	            case "%" :
	            case "^" :
	                if (myStack.IsEmpty() || myStack.Size() < 2)
	                    throw "Stack is empty, can not perform [" + strTok + "]";
	                objOp1 = null;
	                objOp2 = null;
	                objTmp = null;
	                objOp2 = myStack.Pop();
	                objOp1 = myStack.Pop();
	                if (IsVariable(objOp1))
	                    objOp1 = getVariable(objOp1);
	                if (IsVariable(objOp2))
	                    objOp2 = getVariable(objOp2);

	                dblVal1 = ToNumber(objOp1);
	                dblVal2 = ToNumber(objOp2);
	                if (isNaN(dblVal1) || isNaN(dblVal2))
	                    throw "Either one of the operand is not a number can not perform [" +
	                            strTok + "]";
	                if (strTok == "^")
	                    myStack.Push(Math.pow(dblVal1, dblVal2));
	                else if (strTok == "*")
	                    myStack.Push((dblVal1 * dblVal2));
	                else if (strTok == "/")
	                    myStack.Push((dblVal1 / dblVal2));
	                else
	                {
	                    debugAssert (dblVal1 + " - " + dblVal2);
	                    myStack.Push((dblVal1 % dblVal2));
	                }
	                break;
	            case "+" :
	            case "-" :
	                if (myStack.IsEmpty() || myStack.Size() < 2)
	                    throw "Stack is empty, can not perform [" + strTok + "]";
	                objOp1 = null;
	                objOp2 = null;
	                objTmp1 = null;
	                objTmp2 = null;
	                strOp = ((strTok == "+") ? "Addition" : "Substraction");
	                objOp2 = myStack.Pop();
	                objOp1 = myStack.Pop();
	                if (IsVariable(objOp1))
	                    objOp1 = getVariable(objOp1);
	                if (IsVariable(objOp2))
	                    objOp2 = getVariable(objOp2);

	                if (IsBoolean(objOp1) || IsBoolean(objOp2))
	                    throw "Can not perform " + strOp + " with boolean values!";
	                else if (isDate(objOp1, dtFormat) && isDate(objOp1, dtFormat))
	                    throw strOp + " of two dates not supported!";
	                else if (typeof(objOp1) == "object" || typeof(objOp1) == "object")
	                    throw strOp + " of two objects not supported!";
	                else if (typeof(objOp1) == "undefined" || typeof(objOp1) == "undefined")
	                    throw strOp + " of two undefined not supported!";
	                else if (IsNumber(objOp1) && IsNumber(objOp2))
	                {
	                    // Number addition
	                    dblVal1 = ToNumber(objOp1);
	                    dblVal2 = ToNumber(objOp2);
	                    if (strTok == "+")
	                        myStack.Push((dblVal1 + dblVal2));
	                    else
	                        myStack.Push((dblVal1 - dblVal2));
	                }
	                else
	                {
	                    if (strTok == "+")
	                        myStack.Push((objOp1 + objOp2));
	                    else
	                        throw strOP + " not supported for strings!"
	                }
	                break;
	            case "=" :
	            case "<" :
	            case ">" :
	            case "<>" :
	            case "<=" :
	            case ">=" :
	                if (myStack.IsEmpty() || myStack.Size() < 2)
	                    throw "Stack is empty, can not perform [" + strTok + "]";
	                objOp1  = null;
	                objOp2  = null;
	                objTmp1 = null;
	                objTmp2 = null;
	                objOp2  = myStack.Pop();
	                objOp1  = myStack.Pop();
	                if (IsVariable(objOp1))
	                    objOp1 = getVariable(objOp1);
	                if (IsVariable(objOp2))
	                    objOp2 = getVariable(objOp2);

	                if (IsNumber(objOp1) && IsNumber(objOp2))
	                {
	                    dblVal1 = ToNumber(objOp1);
	                    dblVal2 = ToNumber(objOp2);
	                    if (strTok == "=")
	                        myStack.Push((dblVal1 == dblVal2));
	                    else if (strTok == "<>")
	                        myStack.Push((dblVal1 != dblVal2));
	                    else if (strTok == ">")
	                        myStack.Push((dblVal1 > dblVal2));
	                    else if (strTok == "<")
	                        myStack.Push((dblVal1 < dblVal2));
	                    else if (strTok == "<=")
	                        myStack.Push((dblVal1 <= dblVal2));
	                    else if (strTok == ">=")
	                        myStack.Push((dblVal1 >= dblVal2));
	                }
	                else if (IsBoolean(objOp1) && IsBoolean(objOp2) &&
	                        (strTok == "=" || strTok == "<>"))
	                {
	                    objTmp1 = ToBoolean(objOp1);
	                    objTmp2 = ToBoolean(objOp2);
	                    if (strTok == "=")
	                        myStack.Push((objTmp1 == objTmp2));
	                    else if (strTok == "<>")
	                        myStack.Push((objTmp1 != objTmp2));
	                }
	                else if (isDate(objOp1, dtFormat) &&
	                            isDate(objOp2, dtFormat))
	                {
	                    if (typeof(objOp1) == "string")
	                        objTmp1 = getDateFromFormat(objOp1, dtFormat);
	                    else
	                        objTmp1 = objOp1;
	                    if (typeof(objOp1) == "string")
	                        objTmp2 = getDateFromFormat(objOp2, dtFormat);
	                    else
	                        objTmp2 = objOp2;
	                    if (strTok == "=")
	                        myStack.Push((objTmp1 == objTmp2));
	                    else if (strTok == "<>")
	                        myStack.Push((objTmp1 != objTmp2));
	                    else if (strTok == ">")
	                        myStack.Push((objTmp1 > objTmp2));
	                    else if (strTok == "<")
	                        myStack.Push((objTmp1 < objTmp2));
	                    else if (strTok == "<=")
	                        myStack.Push((objTmp1 <= objTmp2));
	                    else if (strTok == ">=")
	                        myStack.Push((objTmp1 >= objTmp2));
	                }
	                else if ((typeof(objOp1) == "string" &&
	                        typeof(objOp2) == "string") &&
	                        (strTok == "=" || strTok == "<>"))
	                {
	                    if (strTok == "=")
	                        myStack.Push((objOp1 == objOp2));
	                    else if (strTok == "<>")
	                        myStack.Push((objOp1 != objOp2));
	                }
	                else
	                    throw "For " + strTok +
	                            " operator LHS & RHS should be of same data type!";
	                break;
	            case "&" :
	            case "|" :
	                if (myStack.IsEmpty() || myStack.Size() < 2)
	                    throw "Stack is empty, can not perform [" + strTok + "]";
	                objOp1  = null;
	                objOp2  = null;
	                objTmp1 = null;
	                objTmp2 = null;
	                objOp2  = myStack.Pop();
	                objOp1  = myStack.Pop();
	                if (IsVariable(objOp1))
	                    objOp1 = getVariable(objOp1);
	                if (IsVariable(objOp2))
	                    objOp2 = getVariable(objOp2);

	                if (IsBoolean(objOp1) && IsBoolean(objOp2))
	                {
	                    objTmp1 = ToBoolean(objOp1);
	                    objTmp2 = ToBoolean(objOp2);
	                    if (strTok == "&")
	                        myStack.Push((objTmp1 && objTmp2));
	                    else if (strTok == "|")
	                        myStack.Push((objTmp1 || objTmp2));
	                }
	                else
	                    throw "Logical operator requires LHS & RHS of boolean type!";
	                break;
	            default :
	                // Handle functions and operands
	                if (IsNumber(strTok) || IsBoolean(strTok) ||
	                    isDate(strTok, dtFormat) || typeof(strTok) == "number"
	                    || typeof(strTok) == "boolean" || typeof(strTok) == "object"
	                    || IsVariable(strTok))
	                {
	                    myStack.Push(strTok);
	                    break;
	                }
	                else
	                    HandleFunctions(strTok, myStack, dtFormat, arrVars);
	        }
	        intIndex++;
	    }
	    if (myStack.IsEmpty() || myStack.Size() > 1)
	        throw "Unable to evaluate expression!";
	    else
	        return myStack.Pop();
	}

	/*------------------------------------------------------------------------------
 	 * NAME       : InFixToPostFix
	 * PURPOSE    : Convert an Infix expression into a postfix (RPN) equivalent
	 * PARAMETERS : Infix expression element array
	 * RETURNS    : array containing postfix expression element tokens
	 *----------------------------------------------------------------------------*/
	function InFixToPostFix(arrToks)
	{
	    var myStack;
	    var intCntr, intIndex;
	    var strTok, strTop, strNext, strPrev;
	    var blnStart;

	    var blnStart = false;
	    var intIndex = 0;
	    var arrPFix  = new Array();
	    var myStack  = new Stack();

	    // Infix to postfix converter
	    for (intCntr = 0; intCntr < arrToks.length; intCntr++)
	    {
	        strTok = arrToks[intCntr];
	        debugAssert ("Processing token [" + strTok + "]");
	        switch (strTok)
	        {
	            case "(" :
	                if (IsFunction(myStack.Get(0)))
	                {
	                    arrPFix[intIndex] = ARG_TERMINAL;
	                    intIndex++;
	                }
	                myStack.Push(strTok);
	                break;
	            case ")" :
	                blnStart = true;
	                debugAssert("Stack.Pop [" + myStack.toString());
	                while (!myStack.IsEmpty())
	                {
	                    strTok = myStack.Pop();
	                    if (strTok != "(")
	                    {
	                        arrPFix[intIndex] = strTok;
	                        intIndex++;
	                    }
	                    else
	                    {
	                        blnStart = false;
	                        break;
	                    }
	                }
	                if (myStack.IsEmpty() && blnStart)
	                    throw "Unbalanced parenthesis!";
	                break;
	            case "," :
	                if (myStack.IsEmpty()) break;
	                debugAssert("Pop stack till opening bracket found!")
	                while (!myStack.IsEmpty())
	                {
	                    strTok = myStack.Get(0);
	                    if (strTok == "(") break;
	                    arrPFix[intIndex] = myStack.Pop();
	                    intIndex++;
	                }
	                break;
	            case "!" :
	            case "-" :
	                // check for unary negative operator.
	                if (strTok == "-")
	                {
	                    strPrev = null;
	                    if (intCntr > 0)
	                        strPrev = arrToks[intCntr - 1];
	                    strNext = arrToks[intCntr + 1];
	                    if (strPrev == null || IsOperator(strPrev) || strPrev == "(")
	                    {
	                        debugAssert("Unary negation!")
	                        strTok = UNARY_NEG;
	                    }
	                }
	            case "^" :
	            case "*" :
	            case "/" :
	            case "%" :
	            case "+" :
	                // check for unary + addition operator, we need to ignore this.
	                if (strTok == "+")
	                {
	                    strPrev = null;
	                    if (intCntr > 0)
	                        strPrev = arrToks[intCntr - 1];
	                    strNext = arrToks[intCntr + 1];
	                    if (strPrev == null || IsOperator(strPrev) || strPrev == "(")
	                    {
	                        debugAssert("Unary add, Skipping");
	                        break;
	                    }
	                }
	            case "&" :
	            case "|" :
	            case ">" :
	            case "<" :
	            case "=" :
	            case ">=" :
	            case "<=" :
	            case "<>" :
	                strTop = "";
	                if (!myStack.IsEmpty()) strTop = myStack.Get(0);
	                if (myStack.IsEmpty() || (!myStack.IsEmpty() && strTop == "("))
	                {
	                    debugAssert("Empty stack pushing operator [" + strTok + "]");
	                    myStack.Push(strTok);
	                }
	                else if (Precedence(strTok) > Precedence(strTop))
	                {
	                    debugAssert("[" + strTok +
	                                "] has higher precedence over [" +
	                                strTop + "]");
	                    myStack.Push(strTok);
	                }
	                else
	                {
	                    // Pop operators with precedence >= operator strTok
	                    while (!myStack.IsEmpty())
	                    {
	                        strTop = myStack.Get(0);
	                        if (strTop == "(" || Precedence(strTop) < Precedence(strTok))
	                        {
	                            debugAssert ("[" + strTop +
	                                        "] has lesser precedence over [" +
	                                        strTok + "]")
	                            break;
	                        }
	                        else
	                        {
	                            arrPFix[intIndex] = myStack.Pop();
	                            intIndex++;
	                        }
	                    }
	                    myStack.Push(strTok);
	                }
	                break;
	            default :
	                if (!IsFunction(strTok))
	                {
	                    debugAssert("Token [" + strTok + "] is a variable/number!");
	                    // Token is an operand
	                    if (IsNumber(strTok))
	                        strTok = ToNumber(strTok);
	                    else if (IsBoolean(strTok))
	                        strTok = ToBoolean(strTok);
	                    else if (isDate(strTok, dtFormat))
	                        strTok = getDateFromFormat(strTok, dtFormat);

	                    arrPFix[intIndex] = strTok;
	                    intIndex++;
	                    break;
	                }
	                else
	                {
	                    strTop = "";
	                    if (!myStack.IsEmpty()) strTop = myStack.Get(0);
	                    if (myStack.IsEmpty() || (!myStack.IsEmpty() && strTop == "("))
	                    {
	                        debugAssert("Empty stack pushing operator [" + strTok + "]");
	                        myStack.Push(strTok);
	                    }
	                    else if (Precedence(strTok) > Precedence(strTop))
	                    {
	                            debugAssert("[" + strTok +
	                                        "] has higher precedence over [" +
	                                        strTop + "]");
	                        myStack.Push(strTok);
	                    }
	                    else
	                    {
	                        // Pop operators with precedence >= operator in strTok
	                        while (!myStack.IsEmpty())
	                        {
	                            strTop = myStack.Get(0);
	                            if (strTop == "(" || Precedence(strTop) < Precedence(strTok))
	                            {
	                                debugAssert ("[" + strTop +
	                                            "] has lesser precedence over [" +
	                                            strTok + "]")
	                                break;
	                            }
	                            else
	                            {
	                                arrPFix[intIndex] = myStack.Pop();
	                                intIndex++;
	                            }
	                        }
	                        myStack.Push(strTok);
	                    }
	                }
	                break;
	        }
	        debugAssert("Stack   : " + myStack.toString() + "\n" +
	                    "RPN Exp : " + arrPFix.toString());

	    }

	    // Pop remaining operators from stack.
	    while (!myStack.IsEmpty())
	    {
	        arrPFix[intIndex] = myStack.Pop();
	        intIndex++;
	    }
	    return arrPFix;
	}
}

/*------------------------------------------------------------------------------
 * NAME       : HandleFunctions
 * PURPOSE    : Execute built-in functions
 * PARAMETERS : pstrTok - The current function name
 *              pStack - Operand stack
 * RETURNS    : Nothing, the result is pushed back onto the stack.
 *----------------------------------------------------------------------------*/
function HandleFunctions(pstrTok, pStack, pdtFormat, parrVars)
{
    var varTmp, varTerm, objTmp;
    var objOp1, objOp2;
    var arrArgs;
    var intCntr;

    if (!IsFunction(pstrTok))
        throw "Unsupported function token [" + pstrTok + "]";

    varTmp = pstrTok.toUpperCase();
    arrArgs = new Array();
    while (!pStack.IsEmpty())
    {
        varTerm = ARG_TERMINAL;
        varTerm = pStack.Pop();
        if (varTerm != ARG_TERMINAL)
            arrArgs[arrArgs.length] = varTerm;
        else
            break;
    }

    switch (varTmp)
    {
        case "DATE" :
            varTerm = new Date();
            pStack.Push(formatDate(varTerm, pdtFormat));
            break;
        case "ACOS" :
        case "ASIN" :
        case "ATAN" :
            throw "Function [" + varTmp + "] is not implemented!";
            break;
        case "ABS" :
        case "CHR" :
        case "COS" :
        case "FIX" :
        case "HEX" :
        case "LOG" :
        case "ROUND" :
        case "SIN" :
        case "SQRT" :
        case "TAN" :
            if (arrArgs.length < 1)
                throw varTmp + " requires atleast one argument!";
            else if (arrArgs.length > 1)
                throw varTmp + " requires only one argument!";
            varTerm = arrArgs[0];
            if (IsVariable(varTerm))
            {
                objTmp = parrVars[varTerm];
                if (objTmp == undefined || objTmp == null)
                    throw "Variable [" + varTerm + "] not defined";
                else
                    varTerm = objTmp;
            }
            if (!IsNumber(varTerm))
                throw varTmp + " operates on numeric operands only!";
            else
            {
                objTmp = ToNumber(varTerm);
                if (varTmp == "ABS")
                    pStack.Push(Math.abs(objTmp));
                else if (varTmp == "CHR")
                    pStack.Push(String.fromCharCode(objTmp));
                else if (varTmp == "COS")
                    pStack.Push(Math.cos(objTmp));
                else if (varTmp == "FIX")
                    pStack.Push(Math.floor(objTmp));
                else if (varTmp == "HEX")
                    pStack.Push(objTmp.toString(16));
                else if (varTmp == "LOG")
                    pStack.Push(Math.log(objTmp));
                else if (varTmp == "ROUND")
                    pStack.Push(Math.round(objTmp));
                else if (varTmp == "SIN")
                    pStack.Push(Math.sin(objTmp));
                else if (varTmp == "SQRT")
                    pStack.Push(Math.sqrt(objTmp));
                else if (varTmp == "TAN")
                    pStack.Push(Math.tan(objTmp));
            }
            break;
        case "ASC" :
            if (arrArgs.length > 1)
                throw varTmp + " requires only one argument!";
            else if (arrArgs.length < 1)
                throw varTmp + " requires atleast one argument!";
            varTerm = arrArgs[0];
            if (IsVariable(varTerm))
            {
                objTmp = parrVars[varTerm];
                if (objTmp == undefined || objTmp == null)
                    throw "Variable [" + varTerm + "] not defined";
                else
                    varTerm = objTmp;
            }
            if (IsNumber(varTerm) || IsBoolean(varTerm) || 
                isDate(varTerm, pdtFormat) || typeof(varTerm) != "string")
                throw varTmp + " requires a string type operand!";
            else
                pStack.Push(varTerm.charCodeAt(0));
            break;
        case "LCASE" :
        case "UCASE" :
        case "CDATE" :
            if (arrArgs.length < 1)
                throw varTmp + " requires atleast one argument!";
            else if (arrArgs.length > 1)
                throw varTmp + " requires only one argument!";

            varTerm = arrArgs[0];
            if (IsVariable(varTerm))
            {
                objTmp = parrVars[varTerm];
                if (objTmp == undefined || objTmp == null)
                    throw "Variable [" + varTerm + "] not defined";
                else
                    varTerm = objTmp;
            }

            if (varTmp == "CDATE" && !isDate(varTerm, pdtFormat))
                throw "CDate can not convert [" + varTerm + "] to a valid date!";
            else if (typeof(varTerm) == "number" || typeof(varTerm) != "string")
                throw varTmp + " requires a string type operand!";
            else
            {
                if (varTmp == "LCASE")
                    pStack.Push(varTerm.toLowerCase());
                else if (varTmp == "UCASE")
                    pStack.Push(varTerm.toUpperCase());
                else if (varTmp == "CDATE")
                {
                    objTmp = getDateFromFormat(varTerm, pdtFormat);
                    pStack.Push(new Date(objTmp));
                }
            }
            break;
        case "LEFT" :
        case "RIGHT" :
            if (arrArgs.length < 2)
                throw varTmp + " requires atleast two arguments!";
            else if (arrArgs.length > 2)
                throw varTmp + " requires only two arguments!";

            for (intCntr = 0; intCntr < arrArgs.length; intCntr++)
            {
                varTerm = arrArgs[intCntr];
                if (IsVariable(varTerm))
                {
                    objTmp = parrVars[varTerm];
                    if (objTmp == undefined || objTmp == null)
                        throw "Variable [" + varTerm + "] not defined";
                    else
                        varTerm = objTmp;
                }
                if (intCntr == 0 && !IsNumber(varTerm))
                    throw varTmp + " oprator requires numaric length!";
                arrArgs[intCntr] = varTerm;
            }
            varTerm = new String(arrArgs[1]);
            objTmp = ToNumber(arrArgs[0]);
            if (varTmp == "LEFT")
                pStack.Push(varTmp.substring(0, objTmp));
            else
                pStack.Push(varTmp.substr((varTerm.length - objTmp), objTmp));
            break;
        case "MID" :
        case "IIF" :
            if (arrArgs.length < 3)
                throw varTmp + " requires atleast three arguments!";
            else if (arrArgs.length > 3)
                throw varTmp + " requires only three arguments!";

            for (intCntr = 0; intCntr < arrArgs.length; intCntr++)
            {
                varTerm = arrArgs[intCntr];
                if (IsVariable(varTerm))
                {
                    objTmp = parrVars[varTerm];
                    if (objTmp == undefined || objTmp == null)
                        throw "Variable [" + varTerm + "] not defined";
                    else
                        varTerm = objTmp;
                }
                if (varTerm == "MID" && intCntr <= 1 && !IsNumber(varTerm))
                    throw varTmp + " oprator requires numaric lengths!";
                else if (varTerm == "IIF" && intCntr == 2 && !IsBoolean(varTerm))
                    throw varTmp + " oprator requires boolean condition!";
                arrArgs[intCntr] = varTerm;
            }
            if (varTmp == "MID")
            {
                varTerm = new String(arrArgs[2]);
                objOp1 = ToNumber(arrArgs[1]);
                objOp2 = ToNumber(arrArgs[0]);
                pStack.Push(varTerm.substring(objOp1, objOp2));
            }
            else
            {
                varTerm = ToBoolean(arrArgs[2]);
                objOp1 = arrArgs[1];
                objOp2 = arrArgs[0];
                if (varTerm)
                    pStack.Push(objOp1);
                else
                    pStack.Push(objOp2);
            }
            break;

        case "AVG" :
        case "MAX" :
        case "MIN" :
            if (arrArgs.length < 2)
                throw varTmp + " requires atleast two operands!";

            objTmp = 0;
            for (intCntr = 0; intCntr < arrArgs.length; intCntr++)
            {
                varTerm = arrArgs[intCntr];
                if (IsVariable(varTerm))
                {
                    objTmp = parrVars[varTerm];
                    if (objTmp == undefined || objTmp == null)
                        throw "Variable [" + varTerm + "] not defined";
                    else
                        varTerm = objTmp;
                }
                if (!IsNumber(varTerm))
                    throw varTmp + " requires numaric operands only!";

                varTerm = ToNumber(varTerm);
                if (varTmp == "AVG")
                    objTmp +=  varTerm;
                else if (varTmp == "MAX" && objTmp < varTerm)
                    objTmp = varTerm;
                else if (varTmp == "MIN")
                {
                    if (intCntr == 1) 
                        objTmp = varTerm;
                    else if (objTmp > varTerm)
                        objTmp = varTerm;
                }
            }
            if (varTmp == "AVG")
                pStack.Push(objTmp/arrArgs.length);
            else
                pStack.Push(objTmp);
            break;
    }
}


/*------------------------------------------------------------------------------
 * NAME       : IsNumber
 * PURPOSE    : Checks whether the specified parameter is a number.
 * RETURNS    : True - If supplied parameter can be succesfully converted to a number
 *              False - Otherwise
 *----------------------------------------------------------------------------*/
function IsNumber(pstrVal)
{
    var dblNo = Number.NaN;

    dblNo = new Number(pstrVal);
    if (isNaN(dblNo))
        return false;
    return true;
}

/*------------------------------------------------------------------------------
 * NAME       : IsBoolean
 * PURPOSE    : Checks whether the specified parameter is a boolean value.
 * PARAMETERS : pstrVal - The string to be checked.
 * RETURNS    : True - If supplied parameter is a boolean constant
 *              False - Otherwise
 *----------------------------------------------------------------------------*/
function IsBoolean(pstrVal)
{
    var varType = typeof(pstrVal);
    var strTmp  = null;

    if (varType == "boolean") return true;
    if (varType == "number" || varType == "function" || varType == undefined)
        return false;
    if (IsNumber(pstrVal)) return false;
    if (varType == "object")
    {
        strTmp = pstrVal.toString();
        if (strTmp.toUpperCase() == "TRUE" || strTmp.toUpperCase() == "FALSE")
            return true;
    }
    if (pstrVal.toUpperCase() == "TRUE" || pstrVal.toUpperCase() == "FALSE")
        return true;
    return false;
}

/*------------------------------------------------------------------------------
 * NAME       : IsVariable
 * PURPOSE    : Checks whether the specified parameter is a user defined variable.
 * RETURNS    : True - If supplied parameter identifies a user defined variable
 *              False - Otherwise 
 *----------------------------------------------------------------------------*/
function IsVariable(pstrVal)
{
     if (lstArithOps.indexOf(pstrVal) >= 0 || lstLogicOps.indexOf(pstrVal) >=0 ||
        lstCompaOps.indexOf(pstrVal) >= 0 || 
        (typeof(pstrVal) == "string" && (pstrVal.toUpperCase() == "TRUE" || 
        pstrVal.toUpperCase() == "FALSE" || parseDate(pstrVal) != null)) || 
        typeof(pstrVal) == "number" || typeof(pstrVal) == "boolean" || 
        typeof(pstrVal) == "object" || IsNumber(pstrVal) || IsFunction(pstrVal))
        return false;
    return true;
}

/*------------------------------------------------------------------------------
 * NAME       : ToNumber
 * PURPOSE    : Converts the supplied parameter to numaric type.
 * PARAMETERS : pobjVal - The string to be converted to equvalent number.
 * RETURNS    : numaric value if string represents a number
 * THROWS     : Exception if string can not be converted 
 *----------------------------------------------------------------------------*/
function ToNumber(pobjVal)
{
    var dblRet = Number.NaN;

    if (typeof(pobjVal) == "number")
        return pobjVal;
    else
    {
        dblRet = new Number(pobjVal);
        return dblRet.valueOf();
    }
}

/*------------------------------------------------------------------------------
 * NAME       : ToBoolean
 * PURPOSE    : Converts the supplied parameter to boolean value
 * PARAMETERS : pobjVal - The parameter to be converted.
 * RETURNS    : Boolean value
 *----------------------------------------------------------------------------*/
function ToBoolean(pobjVal)
{
    var dblNo = Number.NaN;
    var strTmp = null;

    if (pobjVal == null || pobjVal == undefined)
        throw "Boolean value is not defined!";
    else if (typeof(pobjVal) == "boolean")
        return pobjVal;
    else if (typeof(pobjVal) == "number")
        return (pobjval > 0);
    else if (IsNumber(pobjVal))
    {
        dblNo = ToNumber(pobjVal);
        if (isNaN(dblNo)) 
            return null;
        else
            return (dblNo > 0);
    }
    else if (typeof(pobjVal) == "object")
    {
        strTmp = pobjVal.toString();
        if (strTmp.toUpperCase() == "TRUE")
            return true;
        else if (strTmp.toUpperCase() == "FALSE")
            return false;
        else
            return null;
    }
    else if (typeof(pobjVal) == "string")
    {
        if (pobjVal.toUpperCase() == "TRUE")
            return true;
        else if (pobjVal.toUpperCase() == "FALSE")
            return false;
        else
            return null;
    }
    else
        return null;
}

/*------------------------------------------------------------------------------
 * NAME       : Precedence
 * PURPOSE    : Returns the precedence of a given operator
 * PARAMETERS : pstrTok - The operator token whose precedence is to be returned.
 * RETURNS    : Integer
 *----------------------------------------------------------------------------*/
function Precedence(pstrTok)
{
    var intRet = 0;

    switch (pstrTok)
    {
        case "+" :
        case "-" :
            intRet = 5;
            break;
        case "*" :
        case "/" :
        case "%" :
            intRet = 6;
            break;
        case "^" :
            intRet = 7;
            break;
        case UNARY_NEG :
        case "!" :
            intRet = 10;
            break;
        case "(" :
            intRet = 99;
            break;
        case "&" :
        case "|" :
            intRet = 3;
            break;
        case ">" :
        case ">=" :
        case "<" :
        case "<=" :
        case "=" :
        case "<>" :
            intRet = 4;
            break;
        default :
            if (IsFunction(pstrTok))
                intRet = 9;
            else
                intRet = 0;
            break;
    }
    debugAssert ("Precedence of " + pstrTok + " is " + intRet);
    return intRet;
}

/*------------------------------------------------------------------------------
 * NAME       : debugAssert
 * PURPOSE    : Shows a messagebox displaying supplied message
 * PARAMETERS : pObject - The object whose string representation is to be displayed.
 * RETURNS    : Nothing
 *----------------------------------------------------------------------------*/
function debugAssert(pObject)
{
    if (DEBUG_ON)
        alert (pObject.toString())
}


/*------------------------------------------------------------------------------
 * NAME    : Tokanizer.js
 * PURPOSE : Parse a string a make an array of tokens. The following tokens are
 *           reconized.
 *           ()
 *           ^ * / % + -
 *           ! & | TRUE FALSE
 *           < <= > >= <> =
 *           AVG ABS ACOS ASC ASIN ATAN CDATE CHR COS DATE FIX HEX IIF
 *           LCASE LEFT LOG MAX MID MIN RIGHT ROUND SIN SQRT TAN UCASE
 *           , ' "
 * AUTHOR  : Prasad P. Khandekar
 * CREATED : August 19, 2005
 *------------------------------------------------------------------------------
 * -3              // Negative 3 - is the first token
 * 3+-2            // Negative 2 - previous token is an operator and next is a digit
 * 3*-(2)          // Negative 2 - previous token is an operator and next is an opening brace
 * 3*ABS(-2)       // Negative 2 - previous token is an opening brace and next is a digit
 * 3+-SQR(4)       // Negative SQR - previous token is an operator and next is a alpha
 *
 * 3-2             // Positive 2 - previous token is a digit and next is a digit
 * 3 - 2           // Positive 2 - previous token is a digit or space and next is a space
 * ABS(3.4)-2      // Positive 2 - previous token is a closing brace and next is a digit
 * ABS(3.4)- 2     // Positive 2 - previous token is a digit and next is a space
 * ABS(3.4) - 2    // Positive 2 - previous token is a closing brace or space and next is a space
 *------------------------------------------------------------------------------
 * Copyright (c) 2005. Khan Information Systems. All Rights Reserved
 * The contents of this file are subject to the KIS Public License 1.0
 * (the "License"); you may not use this file except in compliance with the
 * License. You should have received a copy of the KIS Public License along with
 * this library; if not, please ask your software vendor to provide one.
 *
 * YOU AGREE THAT THE PROGRAM IS PROVIDED AS-IS, WITHOUT WARRANTY OF ANY KIND
 * (EITHER EXPRESS OR IMPLIED) INCLUDING, WITHOUT LIMITATION, ANY IMPLIED
 * WARRANTY OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE, AND ANY
 * WARRANTY OF NON INFRINGEMENT. IN NO EVENT SHALL THE CONTRIBUTORS BE LIABLE FOR
 * ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
 * ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THE
 * PROGRAM, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *
 * See the License for the specific language governing rights and limitations
 * under the License.
 *-----------------------------------------------------------------------------*/
var lstAlpha    = "a,b,c,d,e,f,g,h,i,j,k,l,m,n,o,p,q,r,s,t,uv,w,x,y,z";
var lstDigits   = "0,1,2,3,4,5,6,7,8,9";
var lstArithOps = "^,*,/,%,+,-";
var lstLogicOps = "!,&,|";
var lstCompaOps = "<,<=,>,>=,<>,=";
var lstFuncOps  = ["AVG","ABS","ACOS","ASC","ASIN","ATAN","CDATE","CHR","COS","DATE","FIX","HEX","IIF","LCASE","LEFT","LOG","MAX","MID","MIN","RIGHT","ROUND","SIN","SQRT","TAN","UCASE"];

/*------------------------------------------------------------------------------
 * NAME       : Tokanize
 * PURPOSE    : Breaks the string into a token array. It also checks whether the
 *              parenthesis, single quotes and double quotes are balanced or not.
 * PARAMETERS : pstrExpression - The string from which token array is to be
 *              constructed.
 * RETURNS    : An array of tokens.
 * THROWS     : Unterminated string constant - Single/Double quotes are not
 *                                             properly terminated
 *              Unbalanced parenthesis - Opening/closing braces are not balanced
 *----------------------------------------------------------------------------*/
function Tokanize(pstrExpression)
{
    var intCntr, intBraces;
    var arrTokens;
    var intIndex, intPos;
    var chrChar, chrNext;
    var strToken, prevToken;

    intCntr   = 0;
    intBraces = 0;
    intIndex  = 0;
    strToken  = "";
    arrTokens = new Array();
    pstrExpression = Trim(pstrExpression);
    while (intCntr < pstrExpression.length)
    {
        prevToken = "";
        chrChar = pstrExpression.substr(intCntr, 1);
        if (window)
            if (window.status)
                window.status = "Processing " + chrChar;
        switch (chrChar)
        {
            case " " :
                if (strToken.length > 0)
                {
                    arrTokens[intIndex] = strToken;
                    intIndex++;
                    strToken = "";
                }
                break;
            case "(":
                intBraces++;
                if (strToken.length > 0)
                {
                    arrTokens[intIndex] = strToken;
                    intIndex++;
                    strToken = "";
                }
                arrTokens[intIndex] = chrChar;
                intIndex++;
                break;
            case ")" :
                intBraces--;
                if (strToken.length > 0)
                {
                    arrTokens[intIndex] = strToken;
                    intIndex++;
                    strToken = "";
                }
                arrTokens[intIndex] = chrChar;
                intIndex++;
                break;
            case "^" :
                if (strToken.length > 0)
                {
                    arrTokens[intIndex] = strToken;
                    intIndex++;
                    strToken = "";
                }
                arrTokens[intIndex] = chrChar;
                intIndex++;
                break;
            case "*" :
                if (strToken.length > 0)
                {
                    arrTokens[intIndex] = strToken;
                    intIndex++;
                    strToken = "";
                }
                arrTokens[intIndex] = chrChar;
                intIndex++;
                break;
            case "/" :
                if (strToken.length > 0)
                {
                    arrTokens[intIndex] = strToken;
                    intIndex++;
                    strToken = "";
                }
                arrTokens[intIndex] = chrChar;
                intIndex++;
                break;
            case "%" :
                if (strToken.length > 0)
                {
                    arrTokens[intIndex] = strToken;
                    intIndex++;
                    strToken = "";
                }
                arrTokens[intIndex] = chrChar;
                intIndex++;
                break;
            case "&" :
                if (strToken.length > 0)
                {
                    arrTokens[intIndex] = strToken;
                    intIndex++;
                    strToken = "";
                }
                arrTokens[intIndex] = chrChar;
                intIndex++;
                break;
            case "|" :
                if (strToken.length > 0)
                {
                    arrTokens[intIndex] = strToken;
                    intIndex++;
                    strToken = "";
                }
                arrTokens[intIndex] = chrChar;
                intIndex++;
                break;
            case "," :
                if (strToken.length > 0)
                {
                    arrTokens[intIndex] = strToken;
                    intIndex++;
                    strToken = "";
                }
                arrTokens[intIndex] = chrChar;
                intIndex++;
                break;
            case "-" :
                if (strToken.length > 0)
                {
                    arrTokens[intIndex] = strToken;
                    intIndex++;
                    strToken = "";
                }
                chrNext = pstrExpression.substr(intCntr + 1, 1);
                if (arrTokens.length > 0)
                    prevToken = arrTokens[intIndex - 1];
                if (intCntr == 0 || ((IsOperator(prevToken) ||
                    prevToken == "(" || prevToken == ",") &&
                    (IsDigit(chrNext) || chrNext == "(")))
                {
                    // Negative Number
                    strToken += chrChar;
                }
                else
                {
                    arrTokens[intIndex] = chrChar;
                    intIndex++;
                    strToken = "";
                }
                break;
            case "+" :
                if (strToken.length > 0)
                {
                    arrTokens[intIndex] = strToken;
                    intIndex++;
                    strToken = "";
                }
                chrNext = pstrExpression.substr(intCntr + 1, 1);
                if (arrTokens.length > 0)
                    prevToken = arrTokens[intIndex - 1];
                if (intCntr == 0 || ((IsOperator(prevToken) ||
                    prevToken == "(" || prevToken == ",") &&
                    (IsDigit(chrNext) || chrNext == "(")))
                {
                    // positive Number
                    strToken += chrChar;
                }
                else
                {
                    arrTokens[intIndex] = chrChar;
                    intIndex++;
                    strToken = "";
                }
                break;
            case "<" :
                chrNext = pstrExpression.substr(intCntr + 1, 1);
                if (strToken.length > 0)
                {
                    arrTokens[intIndex] = strToken;
                    intIndex++;
                    strToken = "";
                }
                if (chrNext == "=")
                {
                    arrTokens[intIndex] = chrChar + "=";
                    intIndex++;
                    intCntr++;
                }
                else if (chrNext == ">")
                {
                    arrTokens[intIndex] = chrChar + ">";
                    intIndex++;
                    intCntr++;
                }
                else
                {
                    arrTokens[intIndex] = chrChar;
                    intIndex++;
                }
                break;
            case ">" :
                chrNext = pstrExpression.substr(intCntr + 1, 1);
                if (strToken.length > 0)
                {
                    arrTokens[intIndex] = strToken;
                    intIndex++;
                    strToken = "";
                }
                if (chrNext == "=")
                {
                    arrTokens[intIndex] = chrChar + "=";
                    intIndex++;
                    intCntr++;
                }
                else
                {
                    arrTokens[intIndex] = chrChar;
                    intIndex++;
                }
                break;
            case "=" :
                if (strToken.length > 0)
                {
                    arrTokens[intIndex] = strToken;
                    intIndex++;
                    strToken = "";
                }
                arrTokens[intIndex] = chrChar;
                intIndex++;
                break;
            case "'" :
                if (strToken.length > 0)
                {
                    arrTokens[intIndex] = strToken;
                    intIndex++;
                    strToken = "";
                }

                intPos = pstrExpression.indexOf(chrChar, intCntr + 1);
                if (intPos < 0)
                    throw "Unterminated string constant";
                else
                {
                    strToken += pstrExpression.substring(intCntr + 1, intPos);
                    arrTokens[intIndex] = strToken;
                    intIndex++;
                    strToken = "";
                    intCntr = intPos;
                }
                break;
            case "\"" :
                if (strToken.length > 0)
                {
                    arrTokens[intIndex] = strToken;
                    intIndex++;
                    strToken = "";
                }

                intPos = pstrExpression.indexOf(chrChar, intCntr + 1);
                if (intPos < 0)
                {
                    throw "Unterminated string constant";
                }
                else
                {
                    strToken += pstrExpression.substring(intCntr + 1, intPos);
                    arrTokens[intIndex] = strToken;
                    intIndex++;
                    strToken = "";
                    intCntr = intPos;
                }
                break;
            default :
                strToken += chrChar;
                break;
        }
        intCntr++;
    }
    if (intBraces > 0)
        throw "Unbalanced parenthesis!";

    if (strToken.length > 0)
        arrTokens[intIndex] = strToken;
    return arrTokens;
}

/*------------------------------------------------------------------------------
 * NAME       : IsDigit
 * PURPOSE    : Checks whether the character specified by chrArg is a numeric
 *              character.
 * PARAMETERS : chrArg - The character to be checked
 * RETURNS    : False - If chrArg is not a numeric character
 *              True - Otherwise
 *----------------------------------------------------------------------------*/
function IsDigit(chrArg)
{
    if (lstDigits.indexOf(chrArg) >= 0)
        return true;
    return false;
}

/*------------------------------------------------------------------------------
 * NAME       : IsAlpha
 * PURPOSE    : Checks whether the character specified by chrArg is a alphabet
 * PARAMETERS : chrArg - The character to be checked
 * RETURNS    : False - If chrArg is not a alphabet
 *              True - Otherwise
 *----------------------------------------------------------------------------*/
function IsAlpha(chrArg)
{
    if (lstAlpha.indexOf(chrArg) >= 0 ||
        lstAlpha.toUpperCase().indexOf(chrArg) >= 0)
        return true;
    return false;
}

/*------------------------------------------------------------------------------
 * NAME       : IsOperator
 * PURPOSE    : Checks whether the string specified by strArg is an operator
 * PARAMETERS : strArg - The string to be checked
 * RETURNS    : False - If strArg is not an operator symbol
 *              True - Otherwise
 *----------------------------------------------------------------------------*/
function IsOperator(strArg)
{
    if (lstArithOps.indexOf(strArg) >= 0 || lstCompaOps.indexOf(strArg) >= 0)
        return true;
    return false;
}

/*------------------------------------------------------------------------------
 * NAME       : IsFunction
 * PURPOSE    : Checks whether the string specified by strArg is a function name
 * PARAMETERS : strArg - The string to be checked
 * RETURNS    : False - If strArg is not a valid built-in function name.
 *              True - Otherwise
 *----------------------------------------------------------------------------*/
function IsFunction(strArg)
{
    var idx = 0;

    strArg = strArg.toUpperCase();
    for (idx = 0; idx < lstFuncOps.length; idx++)
    {
        if (strArg == lstFuncOps[idx])
            return true;
    }
    return false;
}

/*------------------------------------------------------------------------------
 * NAME       : Trim
 * PURPOSE    : Removes trailing and leading spaces from a string.
 * PARAMETERS : pstrVal - The string from which leading and trailing spaces are
 *              to be removed.
 * RETURNS    : A string with leading and trailing spaces removed.
 *----------------------------------------------------------------------------*/
function Trim(pstrVal)
{
    if (pstrVal.length < 1) return "";

    pstrVal = RTrim(pstrVal);
    pstrVal = LTrim(pstrVal);
    if (pstrVal == "")
        return "";
    else
        return pstrVal;
}

/*------------------------------------------------------------------------------
 * NAME       : RTrim
 * PURPOSE    : Removes trailing spaces from a string.
 * PARAMETERS : pstrValue - The string from which trailing spaces are to be removed.
 * RETURNS    : A string with trailing spaces removed.
 *----------------------------------------------------------------------------*/
function RTrim(pstrValue)
{
    var w_space = String.fromCharCode(32);
    var v_length = pstrValue.length;
    var strTemp = "";
    if(v_length < 0)
    {
        return"";
    }
    var iTemp = v_length - 1;

    while(iTemp > -1)
    {
        if(pstrValue.charAt(iTemp) == w_space)
        {
        }
        else
        {
            strTemp = pstrValue.substring(0, iTemp + 1);
            break;
        }
        iTemp = iTemp - 1;
    }
    return strTemp;
}

/*------------------------------------------------------------------------------
 * NAME       : LTrim
 * PURPOSE    : Removes leading spaces from a string.
 * PARAMETERS : pstrValue - The string from which leading spaces are to be removed.
 * RETURNS    : A string with leading spaces removed.
 *----------------------------------------------------------------------------*/
function LTrim(pstrValue)
{
    var w_space = String.fromCharCode(32);
    if(v_length < 1)
    {
        return "";
    }
    var v_length = pstrValue.length;
    var strTemp = "";
    var iTemp = 0;

    while(iTemp < v_length)
    {
        if(pstrValue.charAt(iTemp) == w_space)
        {
        }
        else
        {
            strTemp = pstrValue.substring(iTemp, v_length);
            break;
        }
        iTemp = iTemp + 1;
    }
    return strTemp;
}

/*------------------------------------------------------------------------------
 * NAME    : Stack.js
 * PURPOSE : Stack dta structure using java script
 * AUTHOR  : Prasad P. Khandekar
 * CREATED : August 21, 2005
 *------------------------------------------------------------------------------
 * Copyright (c) 2005. Khan Information Systems. All Rights Reserved
 * The contents of this file are subject to the KIS Public License 1.0
 * (the "License"); you may not use this file except in compliance with the
 * License. You should have received a copy of the KIS Public License along with
 * this library; if not, please ask your software vendor to provide one.
 *
 * YOU AGREE THAT THE PROGRAM IS PROVIDED AS-IS, WITHOUT WARRANTY OF ANY KIND
 * (EITHER EXPRESS OR IMPLIED) INCLUDING, WITHOUT LIMITATION, ANY IMPLIED
 * WARRANTY OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE, AND ANY
 * WARRANTY OF NON INFRINGEMENT. IN NO EVENT SHALL THE CONTRIBUTORS BE LIABLE FOR
 * ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
 * ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THE
 * PROGRAM, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *
 * See the License for the specific language governing rights and limitations
 * under the License.
 *-----------------------------------------------------------------------------*/
// Stack object constructor
function Stack()
{
    this.arrStack = new Array();
    this.intIndex = 0;

    this.Size     = getSize;
    this.IsEmpty  = isStackEmpty;
    this.Push     = pushElement;
    this.Pop      = popElement;
    this.Get      = getElement;
    this.toString = dumpStack;
}

// Converts stack contents into a comma seperated string
function dumpStack()
{
    var intCntr = 0;
    var strRet  =  "";
    if (this.intIndex == 0) return null;
    for (intCntr = 0; intCntr < this.intIndex; intCntr++)
    {
        if (strRet.length == 0)
            strRet += this.arrStack[intCntr];
        else
            strRet += "," + this.arrStack[intCntr];
    }
    return strRet;
}

// Returns size of stack
function getSize()
{
    return this.intIndex;
}

// This method tells us if this Stack object is empty
function isStackEmpty()
{
    if (this.intIndex == 0)
        return true;
    else
        return false;
}

// This method pushes a new element onto the top of the stack
function pushElement(newData)
{
    // Assign our new element to the top
    debugAssert ("Pushing " + newData);
    this.arrStack[this.intIndex] = newData;
    this.intIndex++;
}

// This method pops the top element off of the stack
function popElement()
{
    var retVal;

    retVal = null;
    if (this.intIndex > 0)
    {
        // Assign our new element to the top
        this.intIndex--;
        retVal = this.arrStack[this.intIndex];
    }
    return retVal;
}

// Gets an element at a particular offset from top of the stack
function getElement(intPos)
{
    var retVal;

    //alert ("Size : " + this.intIndex + ", Index " + intPos);
    if (intPos >= 0 && intPos < this.intIndex)
        retVal = this.arrStack[this.intIndex - intPos - 1];
    return retVal;
}

// ===================================================================
// Author: Matt Kruse <matt@mattkruse.com>
// WWW: http://www.mattkruse.com/
//
// NOTICE: You may use this code for any purpose, commercial or
// private, without any further permission from the author. You may
// remove this notice from your final code if you wish, however it is
// appreciated by the author if at least my web site address is kept.
//
// You may *NOT* re-distribute this code in any way except through its
// use. That means, you can include it in your product, or your web
// site, or any other form where the code is actually being used. You
// may not put the plain javascript up on your site for download or
// include it in your javascript libraries for download.
// If you wish to share this code with others, please just point them
// to the URL instead.
// Please DO NOT link directly to my .js files from your site. Copy
// the files to your server and use them there. Thank you.
// ===================================================================

// HISTORY
// ------------------------------------------------------------------
// May 17, 2003: Fixed bug in parseDate() for dates <1970
// March 11, 2003: Added parseDate() function
// March 11, 2003: Added "NNN" formatting option. Doesn't match up
//                 perfectly with SimpleDateFormat formats, but
//                 backwards-compatability was required.

// ------------------------------------------------------------------
// These functions use the same 'format' strings as the
// java.text.SimpleDateFormat class, with minor exceptions.
// The format string consists of the following abbreviations:
//
// Field        | Full Form          | Short Form
// -------------+--------------------+-----------------------
// Year         | yyyy (4 digits)    | yy (2 digits), y (2 or 4 digits)
// Month        | MMM (name or abbr.)| MM (2 digits), M (1 or 2 digits)
//              | NNN (abbr.)        |
// Day of Month | dd (2 digits)      | d (1 or 2 digits)
// Day of Week  | EE (name)          | E (abbr)
// Hour (1-12)  | hh (2 digits)      | h (1 or 2 digits)
// Hour (0-23)  | HH (2 digits)      | H (1 or 2 digits)
// Hour (0-11)  | KK (2 digits)      | K (1 or 2 digits)
// Hour (1-24)  | kk (2 digits)      | k (1 or 2 digits)
// Minute       | mm (2 digits)      | m (1 or 2 digits)
// Second       | ss (2 digits)      | s (1 or 2 digits)
// AM/PM        | a                  |
//
// NOTE THE DIFFERENCE BETWEEN MM and mm! Month=MM, not mm!
// Examples:
//  "MMM d, y" matches: January 01, 2000
//                      Dec 1, 1900
//                      Nov 20, 00
//  "M/d/yy"   matches: 01/20/00
//                      9/2/00
//  "MMM dd, yyyy hh:mm:ssa" matches: "January 01, 2000 12:30:45AM"
// ------------------------------------------------------------------

var MONTH_NAMES=new Array('January','February','March','April','May','June','July','August','September','October','November','December','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec');
var DAY_NAMES=new Array('Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sun','Mon','Tue','Wed','Thu','Fri','Sat');
function LZ(x) {return(x<0||x>9?"":"0")+x}

// ------------------------------------------------------------------
// isDate ( date_string, format_string )
// Returns true if date string matches format of format string and
// is a valid date. Else returns false.
// It is recommended that you trim whitespace around the value before
// passing it to this function, as whitespace is NOT ignored!
// ------------------------------------------------------------------
function isDate(val,format) {
    var date=getDateFromFormat(val,format);
    if (date==0) { return false; }
    return true;
}

// -------------------------------------------------------------------
// compareDates(date1,date1format,date2,date2format)
//   Compare two date strings to see which is greater.
//   Returns:
//   1 if date1 is greater than date2
//   0 if date2 is greater than date1 of if they are the same
//  -1 if either of the dates is in an invalid format
// -------------------------------------------------------------------
function compareDates(date1,dateformat1,date2,dateformat2) {
    var d1=getDateFromFormat(date1,dateformat1);
    var d2=getDateFromFormat(date2,dateformat2);
    if (d1==0 || d2==0) {
        return -1;
    }
    else if (d1 > d2) {
        return 1;
    }
    return 0;
}

// ------------------------------------------------------------------
// formatDate (date_object, format)
// Returns a date in the output format specified.
// The format string uses the same abbreviations as in getDateFromFormat()
// ------------------------------------------------------------------
function formatDate(date,format) {
    format=format+"";
    var result="";
    var i_format=0;
    var c="";
    var token="";
    var y=date.getYear()+"";
    var M=date.getMonth()+1;
    var d=date.getDate();
    var E=date.getDay();
    var H=date.getHours();
    var m=date.getMinutes();
    var s=date.getSeconds();
    var yyyy,yy,MMM,MM,dd,hh,h,mm,ss,ampm,HH,H,KK,K,kk,k;
    // Convert real date parts into formatted versions
    var value=new Object();
    if (y.length < 4) {y=""+(y-0+1900);}
    value["y"]=""+y;
    value["yyyy"]=y;
    value["yy"]=y.substring(2,4);
    value["M"]=M;
    value["MM"]=LZ(M);
    value["MMM"]=MONTH_NAMES[M-1];
    value["NNN"]=MONTH_NAMES[M+11];
    value["d"]=d;
    value["dd"]=LZ(d);
    value["E"]=DAY_NAMES[E+7];
    value["EE"]=DAY_NAMES[E];
    value["H"]=H;
    value["HH"]=LZ(H);
    if (H==0){value["h"]=12;}
    else if (H>12){value["h"]=H-12;}
    else {value["h"]=H;}
    value["hh"]=LZ(value["h"]);
    if (H>11){value["K"]=H-12;} else {value["K"]=H;}
    value["k"]=H+1;
    value["KK"]=LZ(value["K"]);
    value["kk"]=LZ(value["k"]);
    if (H > 11) { value["a"]="PM"; }
    else { value["a"]="AM"; }
    value["m"]=m;
    value["mm"]=LZ(m);
    value["s"]=s;
    value["ss"]=LZ(s);
    while (i_format < format.length) {
        c=format.charAt(i_format);
        token="";
        while ((format.charAt(i_format)==c) && (i_format < format.length)) {
            token += format.charAt(i_format++);
        }
        if (value[token] != null) { result=result + value[token]; }
        else { result=result + token; }
    }
    return result;
}

// ------------------------------------------------------------------
// Utility functions for parsing in getDateFromFormat()
// ------------------------------------------------------------------
function _isInteger(val) {
    var digits="1234567890";
    for (var i=0; i < val.length; i++) {
        if (digits.indexOf(val.charAt(i))==-1) { return false; }
    }
    return true;
}
function _getInt(str,i,minlength,maxlength) {
    for (var x=maxlength; x>=minlength; x--) {
        var token=str.substring(i,i+x);
        if (token.length < minlength) { return null; }
        if (_isInteger(token)) { return token; }
    }
    return null;
}

// ------------------------------------------------------------------
// getDateFromFormat( date_string , format_string )
//
// This function takes a date string and a format string. It matches
// If the date string matches the format string, it returns the
// getTime() of the date. If it does not match, it returns 0.
// ------------------------------------------------------------------
function getDateFromFormat(val,format) {
    val=val+"";
    format=format+"";
    var i_val=0;
    var i_format=0;
    var c="";
    var token="";
    var token2="";
    var x,y;
    var now=new Date();
    var year=now.getYear();
    var month=now.getMonth()+1;
    var date=1;
    var hh=now.getHours();
    var mm=now.getMinutes();
    var ss=now.getSeconds();
    var ampm="";

    while (i_format < format.length) {
        // Get next token from format string
        c=format.charAt(i_format);
        token="";
        while ((format.charAt(i_format)==c) && (i_format < format.length)) {
            token += format.charAt(i_format++);
        }

        // Extract contents of value based on format token
        if (token=="yyyy" || token=="yy" || token=="y") {
            if (token=="yyyy") { x=4;y=4; }
            if (token=="yy")   { x=2;y=2; }
            if (token=="y")    { x=2;y=4; }
            year=_getInt(val,i_val,x,y);

            if (year==null) { return 0; }
            i_val += year.length;
            if (year.length==2) {
                if (year > 70) { year=1900+(year-0); }
                else { year=2000+(year-0); }
            }
        }
        else if (token=="MMM"||token=="NNN"){
            month=0;
            for (var i=0; i<MONTH_NAMES.length; i++) {
                var month_name=MONTH_NAMES[i];
                if (val.substring(i_val,i_val+month_name.length).toLowerCase()==month_name.toLowerCase()) {
                    if (token=="MMM"||(token=="NNN"&&i>11)) {
                        month=i+1;
                        if (month>12) { month -= 12; }
                        i_val += month_name.length;
                        break;
                    }
                }
            }
            if ((month < 1)||(month>12)){return 0;}
        }
        else if (token=="EE"||token=="E"){
            for (var i=0; i<DAY_NAMES.length; i++) {
                var day_name=DAY_NAMES[i];
                if (val.substring(i_val,i_val+day_name.length).toLowerCase()==day_name.toLowerCase()) {
                    i_val += day_name.length;
                    break;
                }
            }
        }
        else if (token=="MM"||token=="M") {
            month=_getInt(val,i_val,token.length,2);
            if(month==null||(month<1)||(month>12)){return 0;}
            i_val+=month.length;}
        else if (token=="dd"||token=="d") {
            date=_getInt(val,i_val,token.length,2);
            if(date==null||(date<1)||(date>31)){return 0;}
            i_val+=date.length;}
        else if (token=="hh"||token=="h") {
            hh=_getInt(val,i_val,token.length,2);
            if(hh==null||(hh<1)||(hh>12)){return 0;}
            i_val+=hh.length;}
        else if (token=="HH"||token=="H") {
            hh=_getInt(val,i_val,token.length,2);
            if(hh==null||(hh<0)||(hh>23)){return 0;}
            i_val+=hh.length;}
        else if (token=="KK"||token=="K") {
            hh=_getInt(val,i_val,token.length,2);
            if(hh==null||(hh<0)||(hh>11)){return 0;}
            i_val+=hh.length;}
        else if (token=="kk"||token=="k") {
            hh=_getInt(val,i_val,token.length,2);
            if(hh==null||(hh<1)||(hh>24)){return 0;}
            i_val+=hh.length;hh--;}
        else if (token=="mm"||token=="m") {
            mm=_getInt(val,i_val,token.length,2);
            if(mm==null||(mm<0)||(mm>59)){return 0;}
            i_val+=mm.length;}
        else if (token=="ss"||token=="s") {
            ss=_getInt(val,i_val,token.length,2);
            if(ss==null||(ss<0)||(ss>59)){return 0;}
            i_val+=ss.length;}
        else if (token=="a") {
            if (val.substring(i_val,i_val+2).toLowerCase()=="am") {ampm="AM";}
            else if (val.substring(i_val,i_val+2).toLowerCase()=="pm") {ampm="PM";}
            else {return 0;}
            i_val+=2;}
        else {
            if (val.substring(i_val,i_val+token.length)!=token) {return 0;}
            else {i_val+=token.length;}
        }
    }
    // If there are any trailing characters left in the value, it doesn't match
    if (i_val != val.length) { return 0; }
    // Is date valid for month?
    if (month==2) {
        // Check for leap year
        if ( ( (year%4==0)&&(year%100 != 0) ) || (year%400==0) ) { // leap year
            if (date > 29){ return 0; }
        }
        else { if (date > 28) { return 0; } }
    }
    if ((month==4)||(month==6)||(month==9)||(month==11)) {
        if (date > 30) { return 0; }
    }
    // Correct hours value
    if (hh<12 && ampm=="PM") { hh=hh-0+12; }
    else if (hh>11 && ampm=="AM") { hh-=12; }
    var newdate=new Date(year,month-1,date,hh,mm,ss);
    return newdate.getTime();
}

// ------------------------------------------------------------------
// parseDate( date_string [, prefer_euro_format] )
//
// This function takes a date string and tries to match it to a
// number of possible date formats to get the value. It will try to
// match against the following international formats, in this order:
// y-M-d   MMM d, y   MMM d,y   y-MMM-d   d-MMM-y  MMM d
// M/d/y   M-d-y      M.d.y     MMM-d     M/d      M-d
// d/M/y   d-M-y      d.M.y     d-MMM     d/M      d-M
// A second argument may be passed to instruct the method to search
// for formats like d/M/y (european format) before M/d/y (American).
// Returns a Date object or null if no patterns match.
// ------------------------------------------------------------------
function parseDate(val) {
    var preferEuro=(arguments.length==2)?arguments[1]:false;
    generalFormats=new Array('y-M-d','MMM d, y','MMM d,y','y-MMM-d','d-MMM-y','MMM d');
    monthFirst=new Array('M/d/y','M-d-y','M.d.y','MMM-d','M/d','M-d');
    dateFirst =new Array('d/M/y','d-M-y','d.M.y','d-MMM','d/M','d-M');
    var checkList=new Array('generalFormats',preferEuro?'dateFirst':'monthFirst',preferEuro?'monthFirst':'dateFirst');
    var d=null;
    for (var i=0; i<checkList.length; i++) {
        var l=window[checkList[i]];
        for (var j=0; j<l.length; j++) {
            d=getDateFromFormat(val,l[j]);
            if (d!=0) { return new Date(d); }
        }
    }
    return null;
}



module.exports = {
    Expression: Expression
}