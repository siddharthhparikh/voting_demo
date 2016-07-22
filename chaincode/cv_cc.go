/*
Copyright IBM Corp 2016 All Rights Reserved.

Licensed under the Apache License, Version 2.0 (the "License");
ou may not use this file except in compliance with the License.
You may obtain a copy of the License at

		 http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

package main

import (
	"encoding/json"
	"errors"
	"fmt"
	"strconv"
	"strings"
	"time"

	"github.com/hyperledger/fabric/core/chaincode/shim"
)

// SimpleChaincode example simple Chaincode implementation
type SimpleChaincode struct {
}

//Account account of user who can vote
type Account struct {
	ID        string `json:"account_id"`
	VoteCount uint64 `json:"vote_count"`
	Email     string `json:"email"`
}

var accountHeader = "account::"

//Topic voting topic and choices
type Topic struct {
	ID         string   `json:"topic_id"`
	Issuer     string   `json:"issuer"`
	Choices    []string `json:"choices[]"`
	Votes      []string `json:"votes[]"` //ints in string form
	ExpireDate string   `json:"expire_date"`
}

var topicHeader = "topic::"

//Vote vote cast for a given topic
type Vote struct {
	Topic    string   `json:"topic"` //topic being voted upon
	Voter    string   `json:"voter"`
	CastDate string   `json:"castDate"` //current time as a string
	Choices  []string `json:"choices[]"`
	Votes    []string `json:"votes[]"`
}

var voteHeader = "vote::"

// ============================================================================================================================
// Main
// ============================================================================================================================
func main() {
	err := shim.Start(new(SimpleChaincode))
	if err != nil {
		fmt.Printf("Error starting Simple chaincode: %s", err)
	}
}

func (t *SimpleChaincode) readStringSafe(col *shim.Column) string {
	if col == nil {
		return ""
	}

	return col.GetString_()
}

func (t *SimpleChaincode) readInt64Safe(col *shim.Column) int64 {
	if col == nil {
		return 0
	}

	return col.GetInt64()
}

func (t *SimpleChaincode) readUint64Safe(col *shim.Column) uint64 {
	if col == nil {
		return 0
	}

	return col.GetUint64()
}

func (t *SimpleChaincode) readBoolSafe(col *shim.Column) bool {
	if col == nil {
		return false
	}

	return col.GetBool()
}

func (t *SimpleChaincode) read(stub *shim.ChaincodeStub, args []string) ([]byte, error) {
	var name string
	var err error

	if len(args) != 1 {
		return nil, errors.New("Incorrect number of arguments. Expecting 1: name of the var to query")
	}

	name = args[0]
	valAsbytes, err := stub.GetState(name)
	if err != nil {
		return nil, errors.New("Error: failed to get state for " + name)
	}

	return valAsbytes, nil
}

func (t *SimpleChaincode) write(stub *shim.ChaincodeStub, args []string) ([]byte, error) {
	var name, value string
	var err error
	fmt.Println("running write")

	if len(args) != 2 {
		return nil, errors.New("Incorrect number of arguments. Expecting 2: name of the variable and value to set")
	}

	name = args[0]
	value = args[1]
	err = stub.PutState(name, []byte(value))
	if err != nil {
		return nil, err
	}
	return nil, nil
}

func (t *SimpleChaincode) createAccount(stub *shim.ChaincodeStub, args []string) ([]byte, error) {
	if len(args) != 3 {
		fmt.Println("Could not obtain username passed to createAcount")
		return nil, errors.New("Incorrect number of arguments. Expecting 3")
	}
	//msgID, err = strconv.ParseUint(strID, 10, 64)

	username := args[0]
	votes, e := strconv.ParseUint(args[2], 10, 64)
	if e != nil {
		fmt.Println(fmt.Sprintf("[ERROR] Could not parse the votes to a number: %s", e))
	}
	email := args[1]
	var account = Account{ID: username, Email: email, VoteCount: votes}
	accountBytes, err := json.Marshal(&account)
	if err != nil {
		fmt.Println("Error creating account " + account.ID)
		return nil, err
	}

	fmt.Println("Attempting to get state of any existing account for " + account.ID + "...")
	existingBytes, err := stub.GetState(accountHeader + account.ID)
	if err != nil {
		fmt.Println("No existing account found for " + account.ID + ", initializing account")
		err = stub.PutState(accountHeader+account.ID, accountBytes)
		//errRequestAccount, Account := requestAccount(account_id)
		if err == nil {
			fmt.Println("Created account " + account.ID)
			return nil, nil
		}

		fmt.Println("Failed to initialize an account for " + account.ID)
		return nil, errors.New("Failed to initialize an account for " + account.ID + " => " + err.Error())
	}

	var existingAccount Account
	err = json.Unmarshal(existingBytes, &existingAccount)
	if err != nil {
		fmt.Println("Error unmarshalling account " + account.ID + "\n--->: " + err.Error())

		if strings.Contains(err.Error(), "unexpected end") {
			fmt.Println("No data means existing account found for " + account.ID + ", initializing account.")
			err = stub.PutState(accountHeader+account.ID, accountBytes)
			//err, account = t.requestAccount(account.ID)
			if err == nil {
				fmt.Println("Created account " + account.ID)
				return nil, nil
			}

			fmt.Println("Failed to create initialize account for " + account.ID)
			return nil, err
		}

		return nil, errors.New("Error unmarshalling existing account " + account.ID)
	}

	fmt.Println("existing account bytes: " + string([]byte(existingBytes)))

	fmt.Println("Account already exists for " + account.ID)
	return nil, errors.New("Can't reinitialize existing user " + account.ID)
}

func (t *SimpleChaincode) requestAccount(stub *shim.ChaincodeStub, args []string) ([]byte, error) {
	if len(args) != 1 {
		fmt.Println("Could not obtain username passed to createAcount")
		return nil, errors.New("Incorrect number of arguments. Expecting 1: username of account")
	}

	username := args[0]
	email := args[1]
	var account = Account{ID: username, Email: email, VoteCount: 0}
	accountBytes, err := json.Marshal(&account)
	fmt.Println(accountBytes)
	if err != nil {
		fmt.Println("Error creating account " + account.ID)
		return nil, err
	}

	fmt.Println("Attempting to get state of any existing account for " + account.ID + "...")
	existingBytes, err := stub.GetState(accountHeader + account.ID)
	if err != nil {
		fmt.Println("No existing account found for " + account.ID + ", initializing account")
		//err = stub.PutState(accountHeader+account.ID, accountBytes)
		//errRequestAccount, Account := requestAccount(account_id)

		//write to the Account request table
		rowAdded, rowErr := stub.InsertRow("AccountRequests", shim.Row{
			Columns: []*shim.Column{
				{&shim.Column_String_{String_: "open"}},
				{&shim.Column_String_{String_: username}},
				{&shim.Column_String_{String_: email}},
			},
		})

		if rowErr != nil || !rowAdded {
			fmt.Println(fmt.Sprintf("[ERROR] Could not insert a message into the ledger: %s", rowErr))
			return nil, rowErr
		}
		if err == nil {
			fmt.Println("Created account " + account.ID)
			return nil, nil
		}

		fmt.Println("Failed to initialize an account for " + account.ID)
		return nil, errors.New("Failed to initialize an account for " + account.ID + " => " + err.Error())
	}

	var existingAccount Account
	err = json.Unmarshal(existingBytes, &existingAccount)
	if err != nil {
		fmt.Println("Error unmarshalling account " + account.ID + "\n--->: " + err.Error())

		if strings.Contains(err.Error(), "unexpected end") {
			fmt.Println("No data means existing account found for " + account.ID + ", initializing account.")
			//err = stub.PutState(accountHeader+account.ID, accountBytes)
			//err, account = t.requestAccount(account.ID)

			//add row to the table
			rowAdded, rowErr := stub.InsertRow("AccountRequests", shim.Row{
				Columns: []*shim.Column{
					{&shim.Column_String_{String_: "open"}},
					{&shim.Column_String_{String_: username}},
					{&shim.Column_String_{String_: email}},
				},
			})

			if rowErr != nil || !rowAdded {
				fmt.Println(fmt.Sprintf("[ERROR] Could not insert a message into the ledger: %s", rowErr))
				return nil, rowErr
			}

			if err == nil {
				fmt.Println("Created account " + account.ID)
				return nil, nil
			}

			fmt.Println("Failed to create initialize account for " + account.ID)
			return nil, err
		}

		return nil, errors.New("Error unmarshalling existing account " + account.ID)
	}

	fmt.Println("existing account bytes: " + string([]byte(existingBytes)))

	fmt.Println("Account already exists for " + account.ID)
	return nil, errors.New("Can't reinitialize existing user " + account.ID)
}

// getAccount returns the account matching the given username

func (t *SimpleChaincode) getAccount(stub *shim.ChaincodeStub, args []string) (Account, error) {
	var account Account
	accountID := args[0]
	accountBytes, err := stub.GetState(accountHeader + accountID)
	if err != nil {
		fmt.Println("Could not find account " + accountID)
		return account, err
	}

	err = json.Unmarshal(accountBytes, &account)
	if err != nil {
		fmt.Println("Error unmarshalling account " + accountID + "\n err: " + err.Error())
		return account, err
	}

	return account, nil
}

func (t *SimpleChaincode) getOpenRequests(stub *shim.ChaincodeStub) ([]string, error) {

	// Retrieve all the rows that are messages for the specified user

	//rowChan, rowErr := stub.GetRows("AccountRequests", []shim.Column{shim.Column{Value: &shim.Column_String_{String_: "open"}}})
	rowChan, rowErr := stub.GetRows("AccountRequests", []shim.Column{shim.Column{Value: &shim.Column_String_{String_: "open"}}})
	if rowErr != nil {
		fmt.Println(fmt.Sprintf("[ERROR] Could not retrieve the rows: %s", rowErr))
		return nil, rowErr
	}

	// Extract the rows
	var account_ids []string
	for row := range rowChan {
		if len(row.Columns) != 0 {
			account_ids = append(account_ids, t.readStringSafe(row.Columns[1]))
			fmt.Println(fmt.Sprintf("[INFO] Row: %v", row))
		}
	}
	return account_ids, nil
}

func (t *SimpleChaincode) changeStatus(stub *shim.ChaincodeStub, args []string) ([]byte, error) {
	status := args[0]
	//acc.ID := args[1]
	//acc.Email := args[3]
	//acc.VoteCount := args[2]
	votes, _ := strconv.ParseUint(args[2], 10, 64)
	acc := Account{ID: args[1], VoteCount: votes, Email: args[3]}
	rowChan, rowErr := stub.GetRows("AccountRequests", []shim.Column{shim.Column{Value: &shim.Column_String_{String_: "open"}}})
	if rowErr != nil {
		fmt.Println(fmt.Sprintf("[ERROR] Could not retrieve the rows: %s", rowErr))
		return nil, nil
	}

	// Extract the rows
	for row := range rowChan {
		if len(row.Columns) != 0 {
			if t.readStringSafe(row.Columns[1]) == acc.ID {
				rowAdded, rowErr := stub.ReplaceRow("AccountRequests", shim.Row{
					Columns: []*shim.Column{
						{&shim.Column_String_{String_: status}},
						{&shim.Column_String_{String_: acc.ID}},
						{&shim.Column_String_{String_: acc.Email}},
					},
				})

				if rowErr != nil || !rowAdded {
					fmt.Println(fmt.Sprintf("[ERROR] Could not replace a row into the ledger: %s", rowErr))
					return nil, nil
				}

				if status == "approved" {
					rowAdded, rowErr = stub.ReplaceRow("AccountRequests", shim.Row{
						Columns: []*shim.Column{
							{&shim.Column_String_{String_: acc.ID}},
							{&shim.Column_Uint64{Uint64: uint64(acc.VoteCount)}},
							{&shim.Column_String_{String_: acc.Email}},
						},
					})

					if rowErr != nil || !rowAdded {
						fmt.Println(fmt.Sprintf("[ERROR] Could not replace a row into the ledger: %s", rowErr))
						return nil, nil
					}
				}
			}
		}
	}
	return nil, nil
}

func (t *SimpleChaincode) getAllRequests(stub *shim.ChaincodeStub, accountID string) (Account, error) {
	var account Account
	accountBytes, err := stub.GetState(accountHeader + accountID)
	if err != nil {
		fmt.Println("Could not find account " + accountID)
		return account, err
	}

	err = json.Unmarshal(accountBytes, &account)
	if err != nil {
		fmt.Println("Error unmarshalling account " + accountID + "\n err: " + err.Error())
		return account, err
	}

	return account, nil
}

func (t *SimpleChaincode) issueTopic(stub *shim.ChaincodeStub, args []string) ([]byte, error) {
	/*		0
			json
			{
				"topic_id": "string",
				"issuer": "username",
				"choices": ["option1", "option2"]
			}
	*/

	if len(args) != 1 {
		fmt.Println("Incorrect number of arguments. Expecting 1: json object of topic being issued")
		return nil, errors.New("Incorrect number of arguments. Expecting 1: json object of topic being issued")
	}

	var topic Topic
	var err error
	//var account Account

	fmt.Println("Unmarshalling topic")
	err = json.Unmarshal([]byte(args[0]), &topic)
	if err != nil {
		fmt.Println("Invalid topic issued")
		return nil, err
	}

	fmt.Println("Getting state of issuer " + topic.Issuer)
	/*
	accountBytes, err := stub.GetState(accountHeader + topic.Issuer)
	if err != nil {
		fmt.Println("Error getting state of - " + topic.Issuer)
		return nil, err
	}
	err = json.Unmarshal(accountBytes, &account)
	if err != nil {
		fmt.Println("Error unmarshalling accountBytes")
		return nil, err
	}
	*/
	fmt.Println("Getting state on topic " + topic.ID)
	existingTopicBytes, err := stub.GetState(topicHeader + topic.ID)
	if existingTopicBytes == nil {
		fmt.Println("Topic does not exist, creating new topic...")

		//create empty array of votes in topic length of choices
		topic.Votes = make([]string, len(topic.Choices))
		for i := 0; i < len(topic.Votes); i++ {
			topic.Votes[i] = "0"
		}
		/*
		//change expire_date to go time format
		expireDateTime, err := time.Parse("01/02/2006", topic.ExpireDate)
		if err != nil {
			fmt.Println(err)
			return nil, err
		}
		topic.ExpireDate = expireDateTime.String()
		*/
		topicBytes, err := json.Marshal(&topic)
		if err != nil {
			fmt.Println("Error marshalling topic")
			return nil, err
		}

		err = stub.PutState(topicHeader+topic.ID, topicBytes)
		if err != nil {
			fmt.Println("Error issuing topic")
			return nil, err
		}

		fmt.Println("Getting Vote Topics")
		voteTopicsBytes, err := stub.GetState("VoteTopics")
		if err != nil {
			fmt.Println("Error retrieving Vote Topics")
			return nil, err
		}
		var voteTopics []string
		err = json.Unmarshal(voteTopicsBytes, &voteTopics)
		if err != nil {
			fmt.Println("Error unmarshalling Vote Topics")
			return nil, err
		}

		fmt.Println("Appending the new topic to Vote Topics")
		foundTopic := false
		for _, tmp := range voteTopics {
			if tmp == topic.ID {
				foundTopic = true
			}
		}
		if foundTopic == false {
			voteTopics = append(voteTopics, topic.ID)
			voteTopicBytesToWrite, err := json.Marshal(&voteTopics)
			if err != nil {
				fmt.Println("Error marshalling vote topics")
				return nil, err
			}
			fmt.Println("Put state on Vote Topics")
			err = stub.PutState("VoteTopics", voteTopicBytesToWrite)
			if err != nil {
				fmt.Println("Error writting vote topics back")
				return nil, err
			}
		}

		//getting here means success so far
		//create table associated with topic
		errCreateTable := stub.CreateTable(topicHeader+topic.ID, []*shim.ColumnDefinition{
			&shim.ColumnDefinition{Name: "TransactionID", Type: shim.ColumnDefinition_UINT64, Key: true},
			&shim.ColumnDefinition{Name: "Voter", Type: shim.ColumnDefinition_STRING, Key: false},
			&shim.ColumnDefinition{Name: "Choice", Type: shim.ColumnDefinition_STRING, Key: false},
			&shim.ColumnDefinition{Name: "Votes", Type: shim.ColumnDefinition_UINT64, Key: false},
			&shim.ColumnDefinition{Name: "Time", Type: shim.ColumnDefinition_STRING, Key: false},
		})

		if errCreateTable != nil {
			fmt.Println("Error creating topic "+topic.ID+" table: ", errCreateTable)
			return nil, errCreateTable
		}

		//all success
		fmt.Println("Issued topic " + topic.ID)
		return nil, nil
	}

	fmt.Println("Topic already exists")
	return nil, nil
}

//ClearTopics is for debugging to clear all topics on ledger
func (t *SimpleChaincode) clearTopics(stub *shim.ChaincodeStub, args []string) ([]byte, error) {
	fmt.Println("Clearing all topics...")

	topics, err := getAllTopics(stub)
	if err != nil {
		fmt.Println("Error: Could not retrieve voting topics: ", err)
		return nil, err
	}

	for _, topic := range topics {
		fmt.Println("Clearing topic ID \"" + topic.ID + "\"...")

		err2 := stub.DelState(topicHeader + topic.ID)
		if err2 != nil {
			fmt.Println("Error: Failed to clear vote topic \""+topic.ID+"\": ", err2)
			return nil, err2
		}
		fmt.Println("Successfully cleared vote topic ID " + topic.ID)

		err2 = stub.DeleteTable(topicHeader + topic.ID)
		if err2 != nil {
			fmt.Println("Error: Failed to delete table for vote topic \""+topic.ID+"\": ", err2)
			return nil, err2
		}
	}

	var blank []string
	blankBytes, _ := json.Marshal(&blank)
	err2 := stub.PutState("VoteTopics", blankBytes)
	if err2 != nil {
		fmt.Println("Error: Failed to clear vote topics: ", err2)
		return nil, err2
	}
	fmt.Println("Successfully cleared vote topics")
	return nil, nil
}

//getAllTopics returns an array of all topicIDs
func getAllTopics(stub *shim.ChaincodeStub) ([]Topic, error) {
	fmt.Println("Retrieving all topics...")

	var allTopics []Topic

	topicsBytes, err := stub.GetState("VoteTopics")
	if err != nil {
		fmt.Println("Error retrieving vote topics")
		return nil, err
	}

	var topics []string
	err = json.Unmarshal(topicsBytes, &topics)
	if err != nil {
		fmt.Println("Error unmarshalling vote topics: ", err)
		return nil, err
	}

	for _, value := range topics {
		topicBytes, err := stub.GetState(topicHeader + value)
		if err != nil {
			fmt.Println("Error retrieving topic "+value+": ", err)
			return nil, err
		}

		var topic Topic
		err = json.Unmarshal(topicBytes, &topic)
		if err != nil {
			fmt.Println("Error unmarshalling topic "+value+": ", err)
			return nil, err
		}

		fmt.Println("Appending topic " + value)
		allTopics = append(allTopics, topic)
	}

	return allTopics, nil
}

func getTopic(stub *shim.ChaincodeStub, topicName string) (Topic, error) {
	fmt.Println("Retrieving topic " + topicName + "...")

	var emptyTopic Topic

	topicBytes, err := stub.GetState(topicHeader + topicName)
	if err != nil {
		fmt.Println("Error retrieving vote topic")
		return emptyTopic, err
	}

	fmt.Println(topicBytes)

	var topic Topic
	err = json.Unmarshal(topicBytes, &topic)
	if err != nil {
		fmt.Println("Error unmarshalling vote topics: ", err)
		return emptyTopic, err
	}

	return topic, nil
}

var transactionID uint64

func (t *SimpleChaincode) castVote(stub *shim.ChaincodeStub, args []string) ([]byte, error) {
	/*		0
			json
			{
				"topic_id": "string",
				"voter": "username",
				"votes": [option1, option2, ...]
			}
	*/

	if len(args) != 1 {
		fmt.Println("Incorrect number of arguments. Expecting 1: json object of vote being cast")
		return nil, errors.New("Incorrect number of arguments. Expecting 1: json object of vote being cast")
	}

	var vote Vote

	fmt.Println("Unmarshalling vote")
	err := json.Unmarshal([]byte(args[0]), &vote)
	if err != nil {
		fmt.Println("Invalid vote cast: ", err)
		return nil, err
	}

	fmt.Println("Vote: ", vote)

	account, errGetAccount := t.getAccount(stub, []string{vote.Voter})

	if errGetAccount != nil {
		fmt.Println("Error retrieving account: ", errGetAccount)
		return nil, errGetAccount
	}

	topicBytes, errTopic := stub.GetState(topicHeader + vote.Topic)
	if errTopic != nil {
		fmt.Println("Error retrieving topic "+vote.Topic+": ", errTopic)
		return nil, errTopic
	}

	var topic Topic
	errJSON := json.Unmarshal(topicBytes, &topic)
	if errJSON != nil {
		fmt.Println("Error unmarshalling topic "+vote.Topic+": ", errJSON)
		return nil, errJSON
	}

	//check votes are valid

	//make sure topic has not expired
	expireTime, errTimeParse := time.Parse("2006-07-08 00:00:00 +0000 UTC", topic.ExpireDate)
	if errTimeParse != nil {
		fmt.Println(errTimeParse)
		return nil, errTimeParse
	}
	if !(time.Now().Before(expireTime)) {
		fmt.Println("[ERROR] Attempted to cast vote on expired topic")
		return nil, errors.New("Attempted to cast vote on expired topic")
	}

	//make sure all votes are >=0
	var count uint64
	for _, quantityStr := range vote.Votes {
		quantity, err := strconv.Atoi(quantityStr)
		if err != nil {
			fmt.Println("Error converting vote from string to int: ", err)
			return nil, err
		}
		if quantity < 0 {
			fmt.Println("Error: attempted to cast vote of negative value")
			return nil, errors.New("Attempted to cast vote of negative value")
		}
		count += uint64(quantity)
	}

	//make sure voter has not cast more votes than allowed
	if count > account.VoteCount {
		fmt.Println("Error: attempted to cast more votes than voter has")
		return nil, errors.New("Attempted to cast more votes than voter has")
	}

	//make sure voter has cast correct number of votes
	if len(vote.Votes) != len(topic.Choices) {
		fmt.Println("Error: number of vote quantities does not match choices count")
		return nil, errors.New("Number of vote quantities does not match choices count")
	}

	fmt.Println("Casting votes for topic " + topic.ID + "...")

	for i := 0; i < len(topic.Choices); i++ {
		fmt.Println("Casting vote for choice ")
		voteQty, err := strconv.Atoi(vote.Votes[i])
		if err != nil {
			fmt.Println(err)
			return nil, err
		}
		if voteQty > 0 {
			//add to array in Topic
			topicVoteTally, err := strconv.Atoi(topic.Votes[i])
			if err != nil {
				fmt.Println(err)
				return nil, err
			}
			topic.Votes[i] = strconv.Itoa(topicVoteTally + voteQty) //convery to int, add vote, then convert back to string

			//add to table
			addedRow, errRow := stub.InsertRow(topicHeader+vote.Topic, shim.Row{
				Columns: []*shim.Column{
					{&shim.Column_Uint64{Uint64: transactionID}},
					{&shim.Column_String_{String_: vote.Voter}},
					{&shim.Column_String_{String_: topic.Choices[i]}},
					{&shim.Column_Uint64{Uint64: uint64(voteQty)}},
					{&shim.Column_String_{String_: vote.CastDate}},
				},
			})

			if errRow != nil || !addedRow {
				fmt.Println("Error creating row in table "+vote.Topic+": ", errRow)
				return nil, errRow
			}

			transactionID++
		}
	}

	//rewrite topic
	topicBytes, err2 := json.Marshal(&topic)
	if err2 != nil {
		fmt.Println(err2)
		return nil, err2
	}
	err2 = stub.PutState(topicHeader+topic.ID, topicBytes)
	if err2 != nil {
		fmt.Println(err2)
		return nil, err2
	}

	fmt.Println("Vote successfully cast!")

	return nil, nil
}

func (t *SimpleChaincode) tallyVotes(stub *shim.ChaincodeStub, args []string) ([]byte, error) {
	if len(args) != 1 {
		fmt.Println("Incorrect number of arguments. Expecting 1: string of topic ID to be queried")
		return nil, errors.New("Incorrect number of arguments. Expecting 1: string of topic ID to be queried")
	}
	/*
		_, errGetAccount := getTopic(stub, args[0])
		if errGetAccount != nil {
			fmt.Println("Could not retrieve vote topic to be tallied")
			return nil, errGetAccount
		}

				for _, col := range row.GetColumns() {
					fmt.Println("[INFO] Column: ", col)
				}
				fmt.Println(fmt.Sprintf("[INFO] Row: %v", row))
			}
		}
	*/
	return nil, nil
}

// Invoke is our entry point to invoke a chaincode function
func (t *SimpleChaincode) Invoke(stub *shim.ChaincodeStub, function string, args []string) ([]byte, error) {
	fmt.Println("invoke is running " + function)

	// Handle different functions
	switch function {
	case "init": //initialize the chaincode state, used as reset
		return t.Init(stub, "init", args)
	case "write":
		return t.write(stub, args)
	case "issue_topic":
		return t.issueTopic(stub, args)
	case "clear_all_topics":
		return t.clearTopics(stub, args)
	case "create_account":
		return t.createAccount(stub, args)
	case "request_account":
		return t.requestAccount(stub, args)
	case "change_status":
		return t.changeStatus(stub, args)
	case "cast_vote":
		return t.castVote(stub, args)
	}

	fmt.Println("invoke did not find func: " + function) //error

	return nil, errors.New("Received unknown function invocation")
}

// Query is our entry point for queries
func (t *SimpleChaincode) Query(stub *shim.ChaincodeStub, function string, args []string) ([]byte, error) {
	fmt.Println("query is running " + function)

	// Handle different functions
	switch function {
	case "read": //read a variable
		return t.read(stub, args)

	case "get_all_topics":
		allTopics, err := getAllTopics(stub)
		if err != nil {
			fmt.Println("Error from get_all_topics")
			return nil, err
		}

		allTopicsBytes, err1 := json.Marshal(&allTopics)
		if err1 != nil {
			fmt.Println("Error marshalling allTopics")
			return nil, err1
		}
		fmt.Println("All success, returning allTopics")
		return allTopicsBytes, nil

	case "get_topic":
		if len(args) != 1 {
			fmt.Println("Incorrect number of arguments. Expecting 1: string of account ID being queried")
			return nil, nil
		}

		topicID := string([]byte(args[0]))

		topic, err1 := getTopic(stub, topicID)
		if err1 != nil {
			fmt.Println("Error from get_topic: ", err1)
			return nil, err1
		}

		topicBytes, err2 := json.Marshal(&topic)
		if err2 != nil {
			fmt.Println("Error marshalling topic: ", err2)
			return nil, err2
		}
		return topicBytes, nil

	case "get_account":
		if len(args) != 1 {
			fmt.Println("Incorrect number of arguments. Expecting 1: string of account ID being queried")
			return nil, nil
		}

		accountID := args[0]

		account, err1 := t.getAccount(stub, []string{accountID})

		if err1 != nil {
			fmt.Println("Error from get_account: ", err1)
			return nil, err1
		}

		accountBytes, err2 := json.Marshal(&account)
		if err2 != nil {
			fmt.Println("Error marshalling account: ", err2)
			return nil, err2
		}
		fmt.Println("All success, returning account")
		return accountBytes, nil

	case "tally_votes":
		if len(args) != 1 {
			fmt.Println("Incorrect number of arguments. Expecting 1: string of topic ID being tallied")
			return nil, nil
		}

		topicID := string([]byte(args[0]))

		strArgs := []string{topicID}

		topicVotes, err1 := t.tallyVotes(stub, strArgs)
		if err1 != nil {
			fmt.Println("Error from tally_votes: ", err1)
			return nil, err1
		}

		topicVotesBytes, err2 := json.Marshal(&topicVotes)
		if err2 != nil {
			fmt.Println("Error marshalling vote tallies: ", err2)
			return nil, err2
		}
		fmt.Println("All success, returning vote tallies")
		return topicVotesBytes, nil

	}
	fmt.Println("query did not find func: " + function) //error

	return nil, errors.New("Received unknown function query")
}

// Init resets all the things
func (t *SimpleChaincode) Init(stub *shim.ChaincodeStub, function string, args []string) ([]byte, error) {
	fmt.Println("Initializing vote topics...")
	var blank []string
	blankBytes, _ := json.Marshal(&blank)
	err := stub.PutState("VoteTopics", blankBytes)
	if err != nil {
		fmt.Println("Failed to initialize vote topics")
	} else {
		fmt.Println("Successfully initialized vote topics")
	}

	fmt.Println("Initializing cast votes...")
	blankBytes2, _ := json.Marshal(&blank)
	err2 := stub.PutState("CastVotes", blankBytes2)
	if err2 != nil {
		fmt.Println("Failed to initialize cast votes")
	} else {
		fmt.Println("Successfully initialized cast votes")
	}

	//for testing: enroll first user "Ethan!"
	fmt.Println("Registering first user \"Ethan\"")
	username := []string{"Ethan", "ecoeyta@us.ibm.com", "16"}
	_, err3 := t.createAccount(stub, username)
	if err3 != nil {
		fmt.Println("Failed to enrolled first user")
	}

	//create table to store all the user account requests
	errAccountRequest := stub.CreateTable("AccountRequests", []*shim.ColumnDefinition{
		&shim.ColumnDefinition{Name: "status", Type: shim.ColumnDefinition_STRING, Key: true},
		&shim.ColumnDefinition{Name: "account_id", Type: shim.ColumnDefinition_STRING, Key: false},
		&shim.ColumnDefinition{Name: "email", Type: shim.ColumnDefinition_STRING, Key: false},
	})
	// Handle table creation errors
	if errAccountRequest != nil {
		fmt.Println(fmt.Sprintf("[ERROR] Could not create account request table: %s", errAccountRequest))
		//console.log(fmt.Sprintf("[ERROR] Could not create account request table: %s", errAccountRequest))
		return nil, errAccountRequest
	}

	//create table to store all the user account requests
	errApprovedAccount := stub.CreateTable("ApprovedAccounts", []*shim.ColumnDefinition{
		&shim.ColumnDefinition{Name: "account_id", Type: shim.ColumnDefinition_STRING, Key: true},
		&shim.ColumnDefinition{Name: "votes", Type: shim.ColumnDefinition_INT64, Key: false},
		&shim.ColumnDefinition{Name: "email", Type: shim.ColumnDefinition_STRING, Key: false},
	})
	// Handle table creation errors
	if errApprovedAccount != nil {
		fmt.Println(fmt.Sprintf("[ERROR] Could not create account request table: %s", errApprovedAccount))
		//console.log(fmt.Sprintf("[ERROR] Could not create account request table: %s", errApprovedAccount))
		return nil, errApprovedAccount
	}
	return nil, nil
}
