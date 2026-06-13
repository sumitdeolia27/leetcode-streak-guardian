import { getQuestionSlug } from './questionUtils';

export interface BankQuestion {
  title: string;
  url: string;
  topic: string;
  slug: string;
}

export interface QuestionBankGroup {
  id: string;
  label: string;
  type: 'topic' | 'preset';
  questions: BankQuestion[];
}

function q(title: string, topic: string, slug?: string): BankQuestion {
  const finalSlug = slug || getQuestionSlug({ title });
  return {
    title,
    topic,
    slug: finalSlug,
    url: `https://leetcode.com/problems/${finalSlug}/`,
  };
}

export const QUESTION_BANK_GROUPS: QuestionBankGroup[] = [
  {
    id: 'arrays',
    label: 'Arrays',
    type: 'topic',
    questions: [
      q('Two Sum', 'Arrays'),
      q('Best Time to Buy and Sell Stock', 'Arrays'),
      q('Contains Duplicate', 'Arrays'),
      q('Product of Array Except Self', 'Arrays'),
      q('Maximum Subarray', 'Arrays'),
      q('Merge Intervals', 'Arrays'),
    ],
  },
  {
    id: 'strings',
    label: 'Strings',
    type: 'topic',
    questions: [
      q('Valid Anagram', 'Strings'),
      q('Valid Palindrome', 'Strings'),
      q('Longest Substring Without Repeating Characters', 'Strings'),
      q('Group Anagrams', 'Strings'),
      q('Minimum Window Substring', 'Strings'),
    ],
  },
  {
    id: 'dp',
    label: 'DP',
    type: 'topic',
    questions: [
      q('Climbing Stairs', 'DP'),
      q('House Robber', 'DP'),
      q('Coin Change', 'DP'),
      q('Longest Increasing Subsequence', 'DP'),
      q('Word Break', 'DP'),
      q('Unique Paths', 'DP'),
    ],
  },
  {
    id: 'graph',
    label: 'Graph',
    type: 'topic',
    questions: [
      q('Number of Islands', 'Graph'),
      q('Clone Graph', 'Graph'),
      q('Course Schedule', 'Graph'),
      q('Pacific Atlantic Water Flow', 'Graph'),
      q('Rotting Oranges', 'Graph'),
    ],
  },
  {
    id: 'trees',
    label: 'Trees',
    type: 'topic',
    questions: [
      q('Invert Binary Tree', 'Trees'),
      q('Maximum Depth of Binary Tree', 'Trees'),
      q('Same Tree', 'Trees'),
      q('Binary Tree Level Order Traversal', 'Trees'),
      q('Validate Binary Search Tree', 'Trees'),
    ],
  },
  {
    id: 'sliding-window',
    label: 'Sliding Window',
    type: 'topic',
    questions: [
      q('Best Time to Buy and Sell Stock', 'Sliding Window'),
      q('Longest Substring Without Repeating Characters', 'Sliding Window'),
      q('Longest Repeating Character Replacement', 'Sliding Window'),
      q('Permutation in String', 'Sliding Window'),
      q('Minimum Window Substring', 'Sliding Window'),
    ],
  },
  {
    id: 'blind-75',
    label: 'Blind 75',
    type: 'preset',
    questions: [
      q('Two Sum', 'Blind 75'),
      q('Best Time to Buy and Sell Stock', 'Blind 75'),
      q('Contains Duplicate', 'Blind 75'),
      q('Product of Array Except Self', 'Blind 75'),
      q('Maximum Subarray', 'Blind 75'),
      q('Number of Islands', 'Blind 75'),
      q('Clone Graph', 'Blind 75'),
      q('Course Schedule', 'Blind 75'),
    ],
  },
  {
    id: 'striver-a2z',
    label: 'Striver A2Z',
    type: 'preset',
    questions: [
      q('Two Sum', 'Striver A2Z'),
      q('Sort Colors', 'Striver A2Z'),
      q('Majority Element', 'Striver A2Z'),
      q('Maximum Subarray', 'Striver A2Z'),
      q('Merge Intervals', 'Striver A2Z'),
      q('Set Matrix Zeroes', 'Striver A2Z'),
    ],
  },
  {
    id: 'neetcode-150',
    label: 'NeetCode 150',
    type: 'preset',
    questions: [
      q('Valid Anagram', 'NeetCode 150'),
      q('Two Sum', 'NeetCode 150'),
      q('Group Anagrams', 'NeetCode 150'),
      q('Top K Frequent Elements', 'NeetCode 150'),
      q('Product of Array Except Self', 'NeetCode 150'),
      q('Valid Sudoku', 'NeetCode 150'),
    ],
  },
  {
    id: 'love-babbar',
    label: 'Love Babbar DSA Sheet',
    type: 'preset',
    questions: [
      q('Reverse String', 'Love Babbar'),
      q('Maximum Subarray', 'Love Babbar'),
      q('Merge Intervals', 'Love Babbar'),
      q('Search in Rotated Sorted Array', 'Love Babbar'),
      q('Valid Palindrome', 'Love Babbar'),
      q('Linked List Cycle', 'Love Babbar'),
    ],
  },
];

export function getQuestionBankGroup(groupId: string) {
  return QUESTION_BANK_GROUPS.find((group) => group.id === groupId);
}
