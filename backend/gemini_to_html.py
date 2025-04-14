import json
import argparse
import os
import sys
import re # For filename sanitization
# --- ADDED IMPORTS ---
import webbrowser
import pathlib
# --- END ADDED IMPORTS ---

def generate_html_from_json(json_data):
    title = json_data.get("title", "Generated Content")
    problem_parts = json_data.get("problem_parts", [])
    formulas = json_data.get("formulas", []) # Assuming formulas is a list containing one dict

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{title}</title>
    <style>
        body {{
            font-family: sans-serif;
            line-height: 1.6;
            margin: 20px;
            background-color: #f4f4f4;
            color: #333;
        }}
        .container {{
            background-color: #fff;
            padding: 25px;
            border-radius: 8px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
            max-width: 800px;
            margin: auto;
        }}
        h1 {{
            color: #2c3e50;
            text-align: center;
            margin-bottom: 20px;
        }}
        .problem-part {{
            position: relative;
            display: inline-block;
            vertical-align: baseline;
            padding: 1px 2px;
            margin: 0 1px;
            border-radius: 3px;
            transition: background-color 0.2s ease-in-out, border 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
            box-sizing: border-box;
        }}
        .problem-text {{
             display: inline;
             padding: 0;
             margin: 0;
             border-radius: 0;
        }}
        input[type="number"].inline-input {{
            -moz-appearance: textfield;
            appearance: textfield;
            border: 1px solid #ccc;
            outline: none;
            font-weight: normal;
            color: #0d1570;
            background-color: #ebecfc;
            min-width: 25px;
            width: auto; /* Adjust if specific width needed */
            text-align: right;
            vertical-align: baseline;
            font-family: inherit;
            font-size: inherit;
            line-height: inherit;
            padding: 2px 4px;
            box-sizing: border-box;
        }}
        input[type='number'].inline-input::-webkit-outer-spin-button,
        input[type='number'].inline-input::-webkit-inner-spin-button {{
            -webkit-appearance: none;
            margin: 0;
        }}
        .answer-output {{
            font-weight: bold;
            color: #086830;
            background-color: #e8f8f5;
            padding: 2px 4px;
            min-width: 25px;
            text-align: right;
            cursor: pointer;
            display: inline-block;
            vertical-align: baseline;
            border-radius: 3px;
             box-sizing: border-box;
        }}
        .highlight {{
            background-color: #fff3cd !important;
            border: 1px solid #ffeeba !important;
            outline: 1px solid #ffeeba;
            box-shadow: 0 0 5px rgba(255, 193, 7, 0.5);
        }}
        input.highlight {{
             border: 1px solid #ffc107 !important;
        }}
        .question-section {{ margin-bottom: 20px; padding-bottom: 15px; border-bottom: 1px dashed #eee; }}
        .question-section:last-child {{ border-bottom: none; }}
        table {{ width: 100%; border-collapse: collapse; margin-top: 10px; margin-bottom: 10px; }}
        th, td {{ border: 1px solid #ddd; padding: 8px; text-align: left; }}
        th {{ background-color: #f2f2f2; font-weight: bold; }}
        .table-container {{ margin-bottom: 15px; display: block; }}
    </style>
</head>
<body>
    <div class="container">
        <h1 id="main-title">{title}</h1>
        <div id="problem-content">
"""
    # --- HTML Generation for problem parts (robust version) ---
    for part in problem_parts:
        part_classes = ["problem-part"]
        style = ""
        part_id = part.get("id")
        part_type = part.get("type")
        part_value = part.get("value")
        part_format = part.get("format", {})
        part_id_attr = f'id="{part_id}"' if part_id else ""

        if part_format.get("textAlign"): style += f"text-align: {part_format['textAlign']};"
        if part_format.get("isBold"): style += "font-weight: bold;"
        if part_format.get("width"): style += f"width: {part_format['width']}px;"

        if part_type == "text":
            part_classes.append("problem-text")
            text_value = str(part_value or "").replace("\n", "<br>")
            html += f'<span class="{" ".join(part_classes)}" {part_id_attr} style="{style}">{text_value}</span>'
        elif part_type == "input":
            part_classes.append("inline-input")
            input_value = part_value if part_value is not None else ""
            html += f'<input type="number" {part_id_attr} value="{input_value}" step="any" class="{" ".join(part_classes)}" style="{style}">'
        elif part_type == "answer_placeholder":
            part_classes.append("answer-output")
            html += f'<span {part_id_attr} class="{" ".join(part_classes)}" style="{style}" data-references="[]">...</span>'
        elif part_type == "table":
             part_classes.append("table-container")
             html += f'<div class="{" ".join(part_classes)}" {part_id_attr} style="{style}">'
             html += "<table>"
             table_rows = part_value if isinstance(part_value, list) else []
             for row_part in table_rows:
                 if not isinstance(row_part, dict): continue
                 html += "<tr>"
                 is_header = row_part.get("isHeader", False)
                 row_cells = row_part.get("value", []) if isinstance(row_part.get("value"), list) else []
                 for cell_part in row_cells:
                     if not isinstance(cell_part, dict): continue
                     cell_style = ""
                     cell_format = cell_part.get("format", {})
                     if cell_format.get("textAlign"): cell_style += f"text-align: {cell_format['textAlign']};"
                     cell_value = str(cell_part.get("value", ""))
                     tag = "th" if is_header else "td"
                     html += f'<{tag} style="{cell_style}">{cell_value}</{tag}>'
                 html += "</tr>"
             html += "</table></div>"

        if part_format.get("newLineAfter"):
            html += '<div style="clear: both;"></div>'
    # --- End HTML Generation ---

    html += """
        </div>
    </div>

    <script type="application/json" id="problem-data-json">
"""
    html += json.dumps(json_data, indent=None, separators=(',', ':'))
    html += """
    </script>

    <script>
      document.addEventListener('DOMContentLoaded', () => {
        // --- Data Loading and Initial Setup ---
        const jsonDataElement = document.getElementById('problem-data-json');
        let problemData;
        try {
             const jsonDataText = jsonDataElement.textContent || '{}';
             problemData = JSON.parse(jsonDataText);
             if (!problemData || typeof problemData !== 'object') throw new Error("Parsed data is not a valid object.");
             problemData.problem_parts = problemData.problem_parts || [];
             problemData.formulas = problemData.formulas || [];
        } catch (e) {
             console.error("Failed to parse problem data JSON:", e);
             const container = document.querySelector('.container');
             if (container) container.innerHTML = '<p style="color: red; font-weight: bold; text-align: center;">Error loading calculation data. Please check the console and the JSON file.</p>';
             problemData = { title: "Error Loading Data", problem_parts: [], formulas: [] };
             return;
        }

        const problemContentDiv = document.getElementById('problem-content');
        const titleElement = document.getElementById('main-title');
        const inputElements = {};
        const answerElements = {};

        if (titleElement) titleElement.textContent = problemData.title || "Calculation";
        else console.warn("Title element '#main-title' not found.");

        // --- Map DOM Elements & Add Input Listeners ---
        problemData.problem_parts.forEach(part => {
             if (!part || !part.type || !part.id) return;
             const element = document.getElementById(part.id);
             if (!element) { console.warn(`Could not find element with ID: ${part.id}`); return; }
             if (part.type === 'input') {
                 element.addEventListener('input', calculateAnswers);
                 inputElements[part.id] = element;
             } else if (part.type === 'answer_placeholder') {
                 answerElements[part.id] = element;
             }
        });

        // --- Determine Dependencies for Highlighting ---
        const allReferenceIds = [...Object.keys(inputElements), ...Object.keys(answerElements)];
        // Assuming formulas = [ { formulaId1: { ... }, formulaId2: { ... } } ]
        if (problemData.formulas && problemData.formulas.length > 0) {
             const formulaGroup = problemData.formulas[0]; // Get the first (and likely only) object in the list
             for (const formulaId in formulaGroup) {
                  if (!formulaGroup.hasOwnProperty(formulaId)) continue;
                  const formula = formulaGroup[formulaId];
                  const answerElement = answerElements[formulaId];

                  if (formula && typeof formula === 'object' && formula.js_fn && answerElement) {
                      const dependencies = [];
                      allReferenceIds.forEach(refId => {
                          if (refId === formulaId) return;
                          try {
                              const regex = new RegExp(`\\b${refId}\\b`);
                              if (regex.test(formula.js_fn)) dependencies.push(refId);
                          } catch(e) {
                              console.error(`Regex error checking dependency "${refId}" in formula "${formulaId}":`, e);
                          }
                      });
                      answerElement.dataset.references = JSON.stringify(dependencies);
                  } else if (formula && formula.js_fn && !answerElement) {
                      console.warn(`Formula found for "${formulaId}" but no corresponding answer element.`);
                  }
             }
        }

        // --- Add Highlighting Event Listeners ---
        for (const answerId in answerElements) {
             if (!answerElements.hasOwnProperty(answerId)) continue;
             const answerElement = answerElements[answerId];
             answerElement.addEventListener('mouseenter', (event) => {
                  try {
                      const dependencies = JSON.parse(event.currentTarget.dataset.references || '[]');
                      dependencies.forEach(refId => {
                          const refEl = inputElements[refId] || answerElements[refId];
                          if (refEl) refEl.classList.add('highlight');
                      });
                  } catch (e) { console.error("Ref parse error (enter) for", event.currentTarget.id, ":", e); }
             });
             answerElement.addEventListener('mouseleave', (event) => {
                  try {
                      const dependencies = JSON.parse(event.currentTarget.dataset.references || '[]');
                      dependencies.forEach(refId => {
                          const refEl = inputElements[refId] || answerElements[refId];
                          if (refEl) refEl.classList.remove('highlight');
                      });
                  } catch (e) { console.error("Ref parse error (leave) for", event.currentTarget.id, ":", e); }
             });
        }

        // --- Calculation Function (Handles Intermediate Values) ---
        function calculateAnswers() {
            // 1. Gather Initial Input Values
            const calculationScope = {};
            for (const id in inputElements) {
                if (inputElements.hasOwnProperty(id)) {
                    calculationScope[id] = Number(inputElements[id].value) || 0;
                }
            }

            // 2. Prepare for Calculation
            const calculatedValues = {};
            let changedInPass;
            const maxPasses = Object.keys(answerElements).length + (problemData.formulas[0] ? Object.keys(problemData.formulas[0]).length : 0) + 1; // Adjusted maxPasses slightly
            let pass;

            // *** Define ALL potential dependency IDs (Inputs AND Formula IDs) ***
            const allPossibleDepIds = [...Object.keys(inputElements)];
            if (problemData.formulas && problemData.formulas.length > 0) {
                 allPossibleDepIds.push(...Object.keys(problemData.formulas[0]));
            }
            // Remove duplicates just in case
            const uniqueDepIds = [...new Set(allPossibleDepIds)];


            // 3. Iterate to Resolve Dependencies
            for (pass = 0; pass < maxPasses; pass++) {
                changedInPass = false;

                if (problemData.formulas && problemData.formulas.length > 0) {
                    const formulaGroup = problemData.formulas[0];
                    for (const formulaId in formulaGroup) {
                        if (!formulaGroup.hasOwnProperty(formulaId)) continue;
                        if (calculatedValues.hasOwnProperty(formulaId)) continue; // Skip if already done

                        const formula = formulaGroup[formulaId];

                        // *** Calculate for ALL formulas, even intermediate ones ***
                        if (formula && typeof formula === 'object' && formula.js_fn) {

                            // *** Get answer element, but don't require it for calculation ***
                            const answerElement = answerElements[formulaId];

                            let result;
                            let canCalculate = true;
                            const currentScope = { ...calculationScope, ...calculatedValues };

                            // *** Check dependencies against ALL possible IDs ***
                            const dependencies = [];
                            uniqueDepIds.forEach(refId => {
                                if (refId === formulaId) return;
                                try {
                                    // Simple check if formula string includes the ID as a potential variable
                                    // Using word boundary regex is more robust but complex here
                                    if (formula.js_fn.includes(refId)) {
                                         // Basic check: does the formula string potentially reference this ID?
                                         // More robust: /\b${refId}\b/.test(formula.js_fn)
                                         // We push even if not yet calculated - check below handles that
                                         dependencies.push(refId);
                                    }
                                } catch(e) {
                                     console.error(`Error checking dependency "${refId}" in formula "${formulaId}":`, e);
                                }
                            });

                            // Now check if all found dependencies are actually available in the current scope
                            dependencies.forEach(depId => {
                                if (!(depId in currentScope)) {
                                    canCalculate = false;
                                }
                            });

                            if (!canCalculate) continue; // Skip if dependencies not met

                            const paramNames = Object.keys(currentScope);
                            const paramValues = paramNames.map(name => currentScope[name]);

                            try {
                                // Dynamic Return Logic (using 'includes' based on previous fix)
                                let functionBody;
                                const containsReturn = formula.js_fn.includes(' return ');
                                if (containsReturn) { functionBody = `"use strict"; ${formula.js_fn}`; }
                                else {
                                    const containsSemicolon = formula.js_fn.includes(';');
                                    if (containsSemicolon) {
                                        const lastSemicolonIndex = formula.js_fn.lastIndexOf(';');
                                        if (lastSemicolonIndex !== -1) {
                                            const part1 = formula.js_fn.substring(0, lastSemicolonIndex + 1);
                                            const part2 = formula.js_fn.substring(lastSemicolonIndex + 1).trim();
                                            if (part2) { functionBody = `"use strict"; ${part1} return ${part2};`; }
                                            else { functionBody = `"use strict"; ${formula.js_fn}`; } // Ends in ;
                                        } else { functionBody = `"use strict"; return ${formula.js_fn};`; } // Fallback
                                    } else { functionBody = `"use strict"; return ${formula.js_fn};`; } // Single expression
                                }

                                const calculatorFunction = new Function(...paramNames, functionBody);
                                result = calculatorFunction(...paramValues);

                                // Handle & Store Result (for ALL formulas)
                                let formattedResult = result; // Result to potentially display
                                let storeResult = true;

                                if (typeof result === 'number') {
                                    if (!isFinite(result)) {
                                        formattedResult = isNaN(result) ? '...' : 'Error (Inf)';
                                        storeResult = false;
                                    } else {
                                        // *** Store the raw number for intermediate calculations ***
                                        calculatedValues[formulaId] = result;
                                        changedInPass = true; // Mark success for loop control

                                        // *** Format for display ONLY if answerElement exists AND decimals specified ***
                                        if (answerElement && formula.decimals !== undefined) {
                                             formattedResult = Number(result.toFixed(formula.decimals)).toLocaleString(undefined, { minimumFractionDigits: formula.decimals, maximumFractionDigits: formula.decimals });
                                        } else if (answerElement) {
                                             // If element exists but no decimals, use default formatting
                                             formattedResult = result.toLocaleString();
                                        }
                                    }
                                } else if (typeof result === 'string') {
                                    calculatedValues[formulaId] = result; // Store string result
                                    formattedResult = result;
                                    changedInPass = true;
                                } else {
                                    formattedResult = 'Error (Type)';
                                    storeResult = false;
                                }

                                // *** Display result CONDITIONALLY ***
                                if (answerElement) {
                                     answerElement.textContent = formattedResult;
                                } else if (storeResult) {
                                     // Optional: Log successful intermediate calculation
                                     // console.log(`[${formulaId}] Intermediate value calculated:`, result);
                                }

                                if (!storeResult) delete calculatedValues[formulaId];

                            } catch (error) {
                                console.error(`[${formulaId}] Error: ${error.message}`);
                                // *** Display error CONDITIONALLY ***
                                if (answerElement) {
                                     answerElement.textContent = 'Error';
                                }
                                delete calculatedValues[formulaId];
                            }
                        } // End if formula valid
                    } // End for each formulaId
                } // End if problemData.formulas exists

                if (!changedInPass) break;
            } // End for pass loop

            if (pass === maxPasses && changedInPass) {
                console.warn("Calculation may not have fully resolved (max passes reached).");
            }
        } // End calculateAnswers function

        // --- Initial Calculation & Final Log ---
        calculateAnswers();
        console.log("Interactive calculator initialized."); // Final confirmation log

      }); // End DOMContentLoaded listener
    </script>
</body>
</html>
"""
    return html

# --- Main execution block ---
if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Generate an interactive HTML page from a JSON definition.")
    parser.add_argument("json_file", help="Path to the input JSON file.")
    args = parser.parse_args()

    try:
        with open(args.json_file, "r", encoding='utf-8') as f: json_data = json.load(f)
    except FileNotFoundError: print(f"Error: Input JSON file not found at '{args.json_file}'"); sys.exit(1)
    except json.JSONDecodeError as e: print(f"Error: Could not decode JSON from file '{args.json_file}'. Details: {e}"); sys.exit(1)
    except Exception as e: print(f"An unexpected error occurred while reading the JSON file: {e}"); sys.exit(1)

    base_filename = re.sub(r'[\\/*?:"<>|]', "", json_data.get("title", "generated_page"))
    output_filename = base_filename + '.html'
    output_directory = "output"
    output_path = os.path.join(output_directory, output_filename)

    try: os.makedirs(output_directory, exist_ok=True)
    except OSError as e: print(f"Error creating output directory '{output_directory}': {e}"); sys.exit(1)

    html_content = generate_html_from_json(json_data)

    try:
        with open(output_path, "w", encoding='utf-8') as f: f.write(html_content)
        print(f"HTML file '{output_path}' created successfully.")
        # --- ADDED: Automatically open the file ---
        try:
            # Get the absolute path to ensure the URI is correct
            absolute_path = os.path.abspath(output_path)
            # Use pathlib to create a file URI (e.g., file:///...)
            file_uri = pathlib.Path(absolute_path).as_uri()
            print(f"Attempting to open '{file_uri}' in default web browser (new tab)...")
            # Open the file URI in a new tab in the default browser
            webbrowser.open(file_uri, new=2)
        except Exception as e:
            # Catch potential errors during opening (e.g., no browser configured)
            print(f"Info: Could not automatically open the file in a browser: {e}")
        # --- END ADDED SECTION ---
    except Exception as e: print(f"An error occurred while writing the HTML file: {e}"); sys.exit(1)