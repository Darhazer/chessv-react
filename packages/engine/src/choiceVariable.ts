/***************************************************************************
 *
 *                              ChessV Web
 *
 *  Port of ChessV — Copyright (C) 2012-2019 by Greg Strong
 *
 *  Distributed under the GNU General Public License, version 3 or later.
 *
 *  Ported from ChessV.Base/ChoiceVariable.cs
 ***************************************************************************/

/**
 * A game variable constrained to one of a fixed set of named choices, each
 * optionally carrying a human-readable description (e.g. the castling style or
 * promotion rule of a variant).
 */
export class ChoiceVariable {
  private readonly choiceList: string[] = [];
  private readonly descriptions = new Map<string, string>();
  private currentValue: string | null = null;
  /** The default choice, used when none is otherwise specified. */
  defaultValue: string | null = null;

  constructor(choices?: string[], defaultChoice: string | null = null) {
    if (choices) this.choiceList.push(...choices);
    this.defaultValue = defaultChoice;
  }

  /** The list of permitted choices. */
  get choices(): readonly string[] {
    return this.choiceList;
  }

  /** The current value (case-insensitively matched against the choices). */
  get value(): string | null {
    return this.currentValue;
  }
  set value(value: string | null) {
    if (value === null) {
      this.currentValue = null;
      return;
    }
    for (const choice of this.choiceList) {
      if (choice.toUpperCase() === value.toUpperCase()) {
        this.currentValue = choice;
        return;
      }
    }
    throw new Error(`Specified value not valid for choice variable: ${value}`);
  }

  /** Whether any choice carries a description. */
  get hasDescriptions(): boolean {
    return this.descriptions.size > 0;
  }

  /** Add a choice, optionally with a description. */
  addChoice(newChoice: string, description?: string): void {
    this.choiceList.push(newChoice);
    if (description !== undefined) this.descriptions.set(newChoice, description);
  }

  /** Remove a choice. */
  removeChoice(choice: string): void {
    const index = this.choiceList.indexOf(choice);
    if (index >= 0) this.choiceList.splice(index, 1);
    this.descriptions.delete(choice);
  }

  /** The description of a choice, or null. */
  describeChoice(choice: string): string | null {
    return this.descriptions.get(choice) ?? null;
  }

  /** An independent copy. */
  clone(): ChoiceVariable {
    const copy = new ChoiceVariable([...this.choiceList], this.defaultValue);
    copy.currentValue = this.currentValue;
    return copy;
  }

  toString(): string {
    return this.currentValue ?? '';
  }
}
