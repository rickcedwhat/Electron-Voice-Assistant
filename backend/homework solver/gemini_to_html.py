import json
import argparse
import os
import sys
import re # For filename sanitization
import webbrowser
import pathlib

def generate_html_from_json(json_data):
    title = json_data.get("title", "Generated Content")
    problem_parts = json_data.get("problem_parts", [])
    # Ensure formulas is handled correctly, assuming it's a list containing one dict
    formulas_group = {}
    if isinstance(json_data.get("formulas"), list) and len(json_data["formulas"]) > 0:
        if isinstance(json_data["formulas"][0], dict):
            formulas_group = json_data["formulas"][0]

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{title}</title>
    <style>
        /* General Styles */
        body {{ font-family: sans-serif; line-height: 1.6; margin: 20px; background-color: #f4f4f4; color: #333; }}
        .container {{ background-color: #fff; padding: 25px; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); max-width: 800px; margin: auto; }}
        h1 {{ color: #2c3e50; text-align: center; margin-bottom: 20px; }}
        /* Problem Part Base */
        .problem-part {{ position: relative; display: inline-block; vertical-align: baseline; padding: 1px 2px; margin: 0 1px; border-radius: 3px; transition: background-color 0.2s ease-in-out, border 0.2s ease-in-out, box-shadow 0.2s ease-in-out; box-sizing: border-box; }}
        .problem-text {{ display: inline; padding: 0; margin: 0; border-radius: 0; }}
        /* Input Styling */
        input[type="number"].inline-input {{ -moz-appearance: textfield; appearance: textfield; border: 1px solid #ccc; outline: none; font-weight: normal; color: #0d1570; background-color: #ebecfc; min-width: 25px; width: auto; text-align: right; vertical-align: baseline; font-family: inherit; font-size: inherit; line-height: inherit; padding: 2px 4px; box-sizing: border-box; }}
        input[type='number'].inline-input::-webkit-outer-spin-button, input[type='number'].inline-input::-webkit-inner-spin-button {{ -webkit-appearance: none; margin: 0; }}
        /* Answer Placeholder Styling */
        .answer-output {{ font-weight: bold; color: #086830; background-color: #e8f8f5; padding: 2px 4px; min-width: 25px; text-align: right; cursor: pointer; display: inline-block; vertical-align: baseline; border-radius: 3px; box-sizing: border-box; }}
        /* Table Styling */
        table {{ width: 100%; border-collapse: collapse; margin-top: 10px; margin-bottom: 10px; }}
        th, td {{ border: 1px solid #ddd; padding: 8px; text-align: left; }}
        th {{ background-color: #f2f2f2; font-weight: bold; }}
        .table-container {{ margin-bottom: 15px; display: block; }}

       #calculation-tooltip {{
           display: none; /* Hidden by default */
           position: absolute;
           border: 1px solid #bbb;
           background-color: #fefefe;
           color: #333;
           padding: 10px;
           border-radius: 5px;
           box-shadow: 0 2px 5px rgba(0,0,0,0.2);
           z-index: 1000; /* Ensure it's on top */
           /* REMOVED pointer-events: none; */
           white-space: pre-wrap;
           font-family: monospace;
           font-size: 0.85em;
           max-width: 400px;
       }}

       /* Style for the close button inside the tooltip */
       .tooltip-close-btn {{
           position: absolute;
           top: 2px;
           right: 5px;
           background: none;
           border: none;
           font-size: 1.1em;
           font-weight: bold;
           cursor: pointer;
           color: #888;
           padding: 0 2px;
       }}
       .tooltip-close-btn:hover {{
           color: #333;
       }}
    </style>
</head>
<body>
    <div class="container">
        <h1 id="main-title">{title}</h1>
        <div id="problem-content">
"""
    # --- HTML Generation Loop ---
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
        if part_format.get("width"): style += f"width: {part_format['width']}px;" # Assuming px

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
            # Removed data-references here, calculated on hover now if needed
            html += f'<span {part_id_attr} class="{" ".join(part_classes)}" style="{style}">...</span>'
        elif part_type == "table":
            part_classes.append("table-container")
            html += f'<div class="{" ".join(part_classes)}" {part_id_attr} style="{style}"><table>'
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
    # --- End HTML Loop ---

    html += """
        </div> </div> <div id="calculation-tooltip">Tooltip content goes here</div>

    <script type="application/json" id="problem-data-json">
"""
    # Embed the whole json_data compactly
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
             if (!problemData || typeof problemData !== 'object') throw new Error("Parsed data is not valid.");
             problemData.problem_parts = problemData.problem_parts || [];
             problemData.formulas = problemData.formulas || [];
        } catch (e) {
             console.error("Failed to parse problem data JSON:", e);
             const container = document.querySelector('.container');
             if (container) container.innerHTML = '<p style="color:red;font-weight:bold;text-align:center;">Error loading calculation data.</p>';
             problemData = { title: "Error", problem_parts: [], formulas: [] }; // Set empty defaults
             return;
        }

        const titleElement = document.getElementById('main-title');
        const inputElements = {};
        const answerElements = {};

        if (titleElement) titleElement.textContent = problemData.title || "Calculation";
        else console.warn("Title element '#main-title' not found.");

        // --- Map DOM Elements & Add Input Listeners ---
        problemData.problem_parts.forEach(part => {
             if (!part || !part.type || !part.id) return;
             const element = document.getElementById(part.id);
             if (!element) { console.warn(`Element not found: ${part.id}`); return; }
             if (part.type === 'input') {
                 element.addEventListener('input', calculateAnswers);
                 inputElements[part.id] = element;
             } else if (part.type === 'answer_placeholder') {
                 answerElements[part.id] = element;
             }
        });

        let calculatedValues = {}; // Make sure this is accessible

        // --- Get Tooltip Element ---
        const tooltipElement = document.getElementById('calculation-tooltip');
        if (!tooltipElement) { console.error("Tooltip element not found!"); return; }

        // --- Calculate All Potential Dependency IDs Once (as before) ---
        const allFormulaIds = (problemData.formulas && problemData.formulas.length > 0 && typeof problemData.formulas[0] === 'object') ? Object.keys(problemData.formulas[0]) : [];
        const allPossibleDepIds = [...Object.keys(inputElements), ...allFormulaIds];
        const uniqueDepIds = [...new Set(allPossibleDepIds)];

        // --- State for active tooltip ---
        let activeTooltipTargetId = null;

        // --- Function to close tooltip ---
        function closeTooltip() {
            tooltipElement.style.display = 'none';
            tooltipElement.innerHTML = ''; // Clear content
            activeTooltipTargetId = null;
        }

        // --- Add Click-Triggered Tooltip Event Listeners ---
        for (const answerId in answerElements) {
            if (!answerElements.hasOwnProperty(answerId)) continue;
            const answerElement = answerElements[answerId];

            answerElement.addEventListener('click', (event) => {
                const formulaId = event.currentTarget.id;

                // If clicking the currently active element, toggle off
                if (tooltipElement.style.display === 'block' && activeTooltipTargetId === formulaId) {
                    closeTooltip();
                    return;
                }

                // --- Fetch Formula Data --- (same as before)
                let formulaData = null;
                if (problemData.formulas && problemData.formulas.length > 0 && problemData.formulas[0].hasOwnProperty(formulaId)) {
                     formulaData = problemData.formulas[0][formulaId];
                }

                let tooltipContent = '';
                if (!formulaData || !formulaData.js_fn) {
                    tooltipContent = 'No calculation details available.';
                } else {
                    // --- Generate Tooltip Content --- (same as before)
                    const js_fn = formulaData.js_fn;
                    const finalResultText = event.currentTarget.textContent;
                    const dependencyDetails = [];
                    const currentScope = { ...calculationScope, ...calculatedValues }; // Get up-to-date values

                    uniqueDepIds.forEach(refId => {
                         if (refId === formulaId) return;
                         try {
                             if (js_fn.includes(refId)) { // Simple check
                                 if (currentScope.hasOwnProperty(refId)) {
                                     let value = currentScope[refId];
                                     let displayValue = (typeof value === 'number') ? value.toLocaleString() : value;
                                     dependencyDetails.push(`${refId}: ${displayValue}`);
                                 }
                             }
                         } catch(e) { /* ignore errors */ }
                     });

                    // Construct content WITH close button
                    tooltipContent = `<button class="tooltip-close-btn" title="Close">×</button>`; // Add close button
                    tooltipContent += `Formula:\n<pre style="margin: 0; padding: 2px 0 5px 0; background-color: #eee; overflow-x: auto;">${js_fn}</pre>\n`;
                    if (dependencyDetails.length > 0) {
                        tooltipContent += `Inputs Used:\n${dependencyDetails.join('<br>')}\n`;
                    }
                    tooltipContent += `\nFinal Result:\n${finalResultText}`;
                }

                tooltipElement.innerHTML = tooltipContent; // Set content

                // --- Add listener to the new close button ---
                const closeBtn = tooltipElement.querySelector('.tooltip-close-btn');
                if(closeBtn) {
                    closeBtn.addEventListener('click', closeTooltip);
                }

                // --- Position Tooltip Relative to Clicked Element ---
                const rect = event.currentTarget.getBoundingClientRect();
                // Position below the element, considering scroll position
                tooltipElement.style.left = `${rect.left + window.scrollX}px`;
                tooltipElement.style.top = `${rect.bottom + window.scrollY + 5}px`; // 5px below element

                // Handle potential overflow off-screen (simple example)
                const tooltipRect = tooltipElement.getBoundingClientRect(); // Get size after setting content
                 if (tooltipRect.right > window.innerWidth) {
                     tooltipElement.style.left = `${window.innerWidth - tooltipRect.width - 10}px`; // Adjust left if overflowing right
                 }
                 if (tooltipRect.left < 0) {
                      tooltipElement.style.left = `10px`; // Adjust if overflowing left
                 }
                 // Add similar check for bottom overflow if needed

                tooltipElement.style.display = 'block'; // Show tooltip
                activeTooltipTargetId = formulaId; // Mark this as active
            });
        } // End loop for adding listeners

        // --- Add listener to close tooltip if clicking outside ---
         document.addEventListener('click', (event) => {
             if (tooltipElement.style.display === 'block') {
                 // Check if the click was outside the tooltip AND outside any answer element
                 const isClickInsideTooltip = tooltipElement.contains(event.target);
                 const isClickOnAnswerElement = Object.values(answerElements).some(el => el.contains(event.target));

                 if (!isClickInsideTooltip && !isClickOnAnswerElement) {
                     closeTooltip();
                 }
             }
         });

        // --- Calculation Function ---
        function calculateAnswers() {
            const localCalculationScope = {}; // Use local scope for initial inputs in this run
            for (const id in inputElements) {
                if (inputElements.hasOwnProperty(id)) {
                    localCalculationScope[id] = Number(inputElements[id].value) || 0;
                }
            }
            // Reset global calculated values for this run
            calculatedValues = {};
            let changedInPass;
            const maxPasses = uniqueDepIds.length + 1; // Base maxPasses on total IDs
            let pass;

            for (pass = 0; pass < maxPasses; pass++) {
                changedInPass = false;
                if (problemData.formulas && problemData.formulas.length > 0) {
                    const formulaGroup = problemData.formulas[0];
                    for (const formulaId in formulaGroup) {
                        if (!formulaGroup.hasOwnProperty(formulaId)) continue;
                        if (calculatedValues.hasOwnProperty(formulaId)) continue;

                        const formula = formulaGroup[formulaId];
                        if (formula && typeof formula === 'object' && formula.js_fn) {
                            const answerElement = answerElements[formulaId]; // May be null for intermediate
                            let result;
                            let canCalculate = true;
                            // *** Use combined scope for calculation check ***
                            const currentCalculationScope = { ...localCalculationScope, ...calculatedValues };

                            // Check dependencies (more robust check)
                            const dependencies = [];
                             uniqueDepIds.forEach(refId => {
                                if (refId === formulaId) return;
                                try {
                                     const regex = new RegExp(`\\b${refId}\\b`); // Use regex here
                                     if (regex.test(formula.js_fn)) {
                                         dependencies.push(refId);
                                     }
                                } catch(e) { /* ignore regex errors */ }
                             });

                            dependencies.forEach(depId => { if (!(depId in currentCalculationScope)) canCalculate = false; });

                            if (!canCalculate) continue;

                            const paramNames = Object.keys(currentCalculationScope);
                            const paramValues = paramNames.map(name => currentCalculationScope[name]);

                            try {
                                let functionBody;
                                const containsReturn = formula.js_fn.includes(' return ');
                                if (containsReturn) {
                                     if (formula.js_fn.trim().startsWith('(') && formula.js_fn.trim().endsWith('()')) {
                                         functionBody = `"use strict"; return ${formula.js_fn};`;
                                     } else { functionBody = `"use strict"; ${formula.js_fn}`; }
                                } else {
                                     const containsSemicolon = formula.js_fn.includes(';');
                                     if (containsSemicolon) {
                                         const lastSemicolonIndex = formula.js_fn.lastIndexOf(';');
                                         if (lastSemicolonIndex !== -1) {
                                             const part1 = formula.js_fn.substring(0, lastSemicolonIndex + 1);
                                             const part2 = formula.js_fn.substring(lastSemicolonIndex + 1).trim();
                                             if (part2) { functionBody = `"use strict"; ${part1} return ${part2};`; }
                                             else { functionBody = `"use strict"; ${formula.js_fn}`; }
                                         } else { functionBody = `"use strict"; return ${formula.js_fn};`; }
                                     } else { functionBody = `"use strict"; return ${formula.js_fn};`; }
                                }

                                const calculatorFunction = new Function(...paramNames, functionBody);
                                result = calculatorFunction(...paramValues);

                                // Handle & Store Result
                                let formattedResult = result;
                                let storeResult = true;

                                if (typeof result === 'number') {
                                    if (!isFinite(result)) { formattedResult = isNaN(result) ? '...' : 'ErrInf'; storeResult = false; }
                                    else {
                                        calculatedValues[formulaId] = result; // Store raw number
                                        changedInPass = true;
                                        if (answerElement && formula.decimals !== undefined) {
                                             formattedResult = Number(result.toFixed(formula.decimals)).toLocaleString(undefined, { minimumFractionDigits: formula.decimals, maximumFractionDigits: formula.decimals });
                                        } else if (answerElement) { formattedResult = result.toLocaleString(); }
                                    }
                                } else if (typeof result === 'string') {
                                    calculatedValues[formulaId] = result; formattedResult = result; changedInPass = true;
                                } else { formattedResult = 'ErrType'; storeResult = false; }

                                if (answerElement) { answerElement.textContent = formattedResult; }
                                if (!storeResult) delete calculatedValues[formulaId];

                            } catch (error) {
                                console.error(`[${formulaId}] Calc Error: ${error.message}`);
                                if (answerElement) { answerElement.textContent = 'Error'; }
                                delete calculatedValues[formulaId];
                            }
                        }
                    }
                }
                if (!changedInPass) break;
            }
            // Update calculationScope for next tooltip hover check AFTER loop finishes
            calculationScope = { ...localCalculationScope, ...calculatedValues };
            if (pass === maxPasses && changedInPass) console.warn("Calc resolve warning.");
        } // End calculateAnswers

        // --- Initial Calculation & Final Log ---
        calculateAnswers();
        console.log("Interactive calculator initialized with tooltips.");

      }); // End DOMContentLoaded
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
            absolute_path = os.path.abspath(output_path)
            file_uri = pathlib.Path(absolute_path).as_uri()
            print(f"Attempting to open '{file_uri}' in default web browser (new tab)...")
            webbrowser.open(file_uri, new=2)
        except Exception as e: print(f"Info: Could not automatically open the file in a browser: {e}")
        # --- END ADDED SECTION ---
    except Exception as e: print(f"An error occurred while writing the HTML file: {e}"); sys.exit(1)