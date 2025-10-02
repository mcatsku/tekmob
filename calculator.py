#!/usr/bin/env python3
"""
Terminal Calculator
A simple yet powerful calculator that can be used in the terminal.
Supports basic arithmetic operations, parentheses, and order of operations.
"""

import re
import sys
import math
from typing import Union, List

class Calculator:
    def __init__(self):
        self.operators = {
            '+': (1, lambda x, y: x + y),
            '-': (1, lambda x, y: x - y),
            '*': (2, lambda x, y: x * y),
            '/': (2, lambda x, y: x / y),
            '//': (2, lambda x, y: x // y),
            '%': (2, lambda x, y: x % y),
            '^': (3, lambda x, y: x ** y),
            '**': (3, lambda x, y: x ** y),
        }
        
        self.functions = {
            'sin': math.sin,
            'cos': math.cos,
            'tan': math.tan,
            'sqrt': math.sqrt,
            'log': math.log10,
            'ln': math.log,
            'abs': abs,
            'round': round,
        }
        
        self.constants = {
            'pi': math.pi,
            'e': math.e,
        }
    
    def tokenize(self, expression: str) -> List[str]:
        """Convert expression string into tokens"""
        # Replace constants
        for const, value in self.constants.items():
            expression = expression.replace(const, str(value))
        
        # Tokenize using regex
        pattern = r'(\d+\.?\d*|[+\-*/()^%]|\*\*|//|[a-zA-Z_]\w*)'
        tokens = re.findall(pattern, expression.replace(' ', ''))
        return tokens
    
    def infix_to_postfix(self, tokens: List[str]) -> List[str]:
        """Convert infix notation to postfix using Shunting Yard algorithm"""
        output = []
        operator_stack = []
        
        for token in tokens:
            if self.is_number(token):
                output.append(token)
            elif token in self.functions:
                operator_stack.append(token)
            elif token in self.operators:
                while (operator_stack and 
                       operator_stack[-1] != '(' and
                       operator_stack[-1] in self.operators and
                       self.operators[operator_stack[-1]][0] >= self.operators[token][0]):
                    output.append(operator_stack.pop())
                operator_stack.append(token)
            elif token == '(':
                operator_stack.append(token)
            elif token == ')':
                while operator_stack and operator_stack[-1] != '(':
                    output.append(operator_stack.pop())
                if operator_stack and operator_stack[-1] == '(':
                    operator_stack.pop()
                if operator_stack and operator_stack[-1] in self.functions:
                    output.append(operator_stack.pop())
        
        while operator_stack:
            output.append(operator_stack.pop())
        
        return output
    
    def evaluate_postfix(self, postfix: List[str]) -> float:
        """Evaluate postfix expression"""
        stack = []
        
        for token in postfix:
            if self.is_number(token):
                stack.append(float(token))
            elif token in self.operators:
                if len(stack) < 2:
                    raise ValueError(f"Invalid expression: not enough operands for '{token}'")
                b = stack.pop()
                a = stack.pop()
                result = self.operators[token][1](a, b)
                stack.append(result)
            elif token in self.functions:
                if len(stack) < 1:
                    raise ValueError(f"Invalid expression: not enough arguments for '{token}'")
                a = stack.pop()
                result = self.functions[token](a)
                stack.append(result)
        
        if len(stack) != 1:
            raise ValueError("Invalid expression")
        
        return stack[0]
    
    def is_number(self, token: str) -> bool:
        """Check if token is a number"""
        try:
            float(token)
            return True
        except ValueError:
            return False
    
    def calculate(self, expression: str) -> Union[float, str]:
        """Main calculation method"""
        try:
            if not expression.strip():
                return "Error: Empty expression"
            
            tokens = self.tokenize(expression)
            postfix = self.infix_to_postfix(tokens)
            result = self.evaluate_postfix(postfix)
            
            # Format result nicely
            if result.is_integer():
                return int(result)
            else:
                return round(result, 10)  # Avoid floating point precision issues
                
        except ZeroDivisionError:
            return "Error: Division by zero"
        except ValueError as e:
            return f"Error: {str(e)}"
        except Exception as e:
            return f"Error: Invalid expression - {str(e)}"

def print_help():
    """Print help information"""
    help_text = """
Terminal Calculator Help
========================

Basic Operations:
  +, -, *, /        Basic arithmetic
  **, ^             Exponentiation
  //, %             Floor division, modulo
  ( )               Parentheses for grouping

Functions:
  sin(x), cos(x), tan(x)    Trigonometric functions
  sqrt(x)                   Square root
  log(x), ln(x)             Logarithms (base 10 and natural)
  abs(x)                    Absolute value
  round(x)                  Round to nearest integer

Constants:
  pi                3.14159...
  e                 2.71828...

Commands:
  help              Show this help
  quit, exit        Exit the calculator
  clear             Clear screen

Examples:
  2 + 3 * 4         = 14
  (2 + 3) * 4       = 20
  sqrt(16)          = 4
  sin(pi/2)         = 1
  2^3               = 8
  10 % 3            = 1
"""
    print(help_text)

def interactive_mode():
    """Run calculator in interactive mode"""
    calc = Calculator()
    print("🧮 Terminal Calculator")
    print("Type 'help' for commands, 'quit' to exit")
    print("-" * 40)
    
    while True:
        try:
            expression = input("calc> ").strip()
            
            if not expression:
                continue
            
            if expression.lower() in ['quit', 'exit', 'q']:
                print("Goodbye! 👋")
                break
            elif expression.lower() == 'help':
                print_help()
                continue
            elif expression.lower() == 'clear':
                import os
                os.system('clear' if os.name == 'posix' else 'cls')
                continue
            
            result = calc.calculate(expression)
            print(f"  = {result}")
            
        except KeyboardInterrupt:
            print("\nGoodbye! 👋")
            break
        except EOFError:
            print("\nGoodbye! 👋")
            break

def main():
    """Main entry point"""
    if len(sys.argv) == 1:
        # Interactive mode
        interactive_mode()
    elif len(sys.argv) == 2 and sys.argv[1] in ['-h', '--help']:
        print_help()
    else:
        # Command line mode
        expression = ' '.join(sys.argv[1:])
        calc = Calculator()
        result = calc.calculate(expression)
        print(result)

if __name__ == "__main__":
    main()
