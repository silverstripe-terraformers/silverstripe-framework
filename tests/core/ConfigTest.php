<?php

class ConfigTest_DefinesFoo extends Object {
	protected static $foo = 1;
}

class ConfigTest_DefinesBar extends ConfigTest_DefinesFoo {
	public static $bar = 2;
}

class ConfigTest_DefinesFooAndBar extends ConfigTest_DefinesFoo {
	protected static $foo = 3;
	public static $bar = 3;
}

class ConfigTest_DefinesFooDoesntExtendObject {
	protected static $foo = 4;
}

class ConfigStaticTest_First extends Config {
	public static $first  = array('test_1');
	public static $second = array('test_1');
	public static $third  = 'test_1';
}

class ConfigStaticTest_Second extends ConfigStaticTest_First {
	public static $first = array('test_2');
}

class ConfigStaticTest_Third extends ConfigStaticTest_Second {
	public static $first  = array('test_3');
	public static $second = array('test_3');
	public static $fourth = array('test_3');
}

class ConfigStaticTest_Fourth extends ConfigStaticTest_Third {
	public static $fourth = array('test_4');
}

class ConfigStaticTest_Combined1 extends Config {
	public static $first  = array('test_1');
	public static $second = array('test_1');
}

class ConfigStaticTest_Combined2 extends ConfigStaticTest_Combined1 {
	public static $first  = array('test_2');
	public static $second = null;
}

class ConfigStaticTest_Combined3 extends ConfigStaticTest_Combined2 {
	public static $first  = array('test_3');
	public static $second = array('test_3');
}

class ConfigTest extends SapphireTest {

	public function testUpdateStatic() {
		$this->assertEquals(Config::inst()->get('ConfigStaticTest_First', 'first', Config::FIRST_SET),
			array('test_1'));
		$this->assertEquals(Config::inst()->get('ConfigStaticTest_Second', 'first', Config::FIRST_SET),
			array('test_2'));
		$this->assertEquals(Config::inst()->get('ConfigStaticTest_Third', 'first', Config::FIRST_SET),
			array('test_3'));

		Config::inst()->update('ConfigStaticTest_First', 'first', array('test_1_2'));
		Config::inst()->update('ConfigStaticTest_Third', 'first', array('test_3_2'));
		Config::inst()->update('ConfigStaticTest_Fourth', 'first', array('test_4'));

		$this->assertEquals(Config::inst()->get('ConfigStaticTest_First', 'first', Config::FIRST_SET),
			array('test_1_2', 'test_1'));

		Config::inst()->update('ConfigStaticTest_Fourth', 'second', array('test_4'));
		Config::inst()->update('ConfigStaticTest_Third', 'second', array('test_3_2'));

		$this->assertEquals(Config::inst()->get('ConfigStaticTest_Fourth', 'second', Config::FIRST_SET),
			array('test_4'));
		$this->assertEquals(Config::inst()->get('ConfigStaticTest_Third', 'second', Config::FIRST_SET),
			array('test_3_2', 'test_3'));

		Config::inst()->remove('ConfigStaticTest_Third', 'second');
		Config::inst()->update('ConfigStaticTest_Third', 'second', array('test_3_2'));
		$this->assertEquals(Config::inst()->get('ConfigStaticTest_Third', 'second', Config::FIRST_SET),
			array('test_3_2'));
	}

	public function testUninheritedStatic() {
		$this->assertEquals(Config::inst()->get('ConfigStaticTest_First',  'third', Config::UNINHERITED), 'test_1');
		$this->assertEquals(Config::inst()->get('ConfigStaticTest_Fourth', 'third', Config::UNINHERITED), null);

		Config::inst()->update('ConfigStaticTest_First', 'first', array('test_1b'));
		Config::inst()->update('ConfigStaticTest_Second', 'first', array('test_2b'));

		// Check that it can be applied to parent and subclasses, and queried directly
		$this->assertContains('test_1b',
			Config::inst()->get('ConfigStaticTest_First', 'first', Config::UNINHERITED));
		$this->assertContains('test_2b',
			Config::inst()->get('ConfigStaticTest_Second', 'first', Config::UNINHERITED));

		// But it won't affect subclasses - this is *uninherited* static
		$this->assertNotContains('test_2b',
			Config::inst()->get('ConfigStaticTest_Third', 'first', Config::UNINHERITED));
		$this->assertNotContains('test_2b',
			Config::inst()->get('ConfigStaticTest_Fourth', 'first', Config::UNINHERITED));

		// Subclasses that don't have the static explicitly defined should allow definition, also
		// This also checks that set can be called after the first uninherited get() 
		// call (which can be buggy due to caching) 
		Config::inst()->update('ConfigStaticTest_Fourth', 'first', array('test_4b'));
		$this->assertContains('test_4b', Config::inst()->get('ConfigStaticTest_Fourth', 'first', Config::UNINHERITED));
	}

	public function testCombinedStatic() {
		$this->assertEquals(Config::inst()->get('ConfigStaticTest_Combined3', 'first'),
			array('test_3', 'test_2', 'test_1'));

		// test that null values are ignored, but values on either side are still merged
		$this->assertEquals(Config::inst()->get('ConfigStaticTest_Combined3', 'second'),
			array('test_3', 'test_1'));
	}

	public function testMerges() {
		$result = array('A' => 1, 'B' => 2, 'C' => 3);
		Config::merge_array_low_into_high($result, array('C' => 4, 'D' => 5));
		$this->assertEquals($result, array('A' => 1, 'B' => 2, 'C' => 3, 'D' => 5));

		$result = array('A' => 1, 'B' => 2, 'C' => 3);
		Config::merge_array_high_into_low($result, array('C' => 4, 'D' => 5));
		$this->assertEquals($result, array('A' => 1, 'B' => 2, 'C' => 4, 'D' => 5));

		$result = array('A' => 1, 'B' => 2, 'C' => array(1, 2, 3));
		Config::merge_array_low_into_high($result, array('C' => array(4, 5, 6), 'D' => 5));
		$this->assertEquals($result, array('A' => 1, 'B' => 2, 'C' => array(1, 2, 3, 4, 5, 6), 'D' => 5));

		$result = array('A' => 1, 'B' => 2, 'C' => array(1, 2, 3));
		Config::merge_array_high_into_low($result, array('C' => array(4, 5, 6), 'D' => 5));
		$this->assertEquals($result, array('A' => 1, 'B' => 2, 'C' => array(4, 5, 6, 1, 2, 3), 'D' => 5));

		$result = array('A' => 1, 'B' => 2, 'C' => array('Foo' => 1, 'Bar' => 2), 'D' => 3);
		Config::merge_array_low_into_high($result, array('C' => array('Bar' => 3, 'Baz' => 4)));
		$this->assertEquals($result, 
			array('A' => 1, 'B' => 2, 'C' => array('Foo' => 1, 'Bar' => 2, 'Baz' => 4), 'D' => 3));

		$result = array('A' => 1, 'B' => 2, 'C' => array('Foo' => 1, 'Bar' => 2), 'D' => 3);
		Config::merge_array_high_into_low($result, array('C' => array('Bar' => 3, 'Baz' => 4)));
		$this->assertEquals($result,
			array('A' => 1, 'B' => 2, 'C' => array('Foo' => 1, 'Bar' => 3, 'Baz' => 4), 'D' => 3));
		
		// test specific ordering of output values, not just that they exist
		$result = array('dev' => 'sc');
		Config::merge_array_high_into_low($result, array('first' => 'First', 'second' => 'Second', 'last' => 'Last'));
		$this->assertEquals($result, array(
			'first' => 'First', 
			'second' => 'Second', 
			'last' => 'Last',
			'dev' => 'sc',
		));

		$keys = array_keys($result);
		$this->assertEquals($keys[0], 'first');
		$this->assertEquals($keys[3], 'dev');

		// If a higher priority item has a non-integer key which is the same as a lower priority item, the value of
		// those items  is merged using these same rules, and the result of the merge is located in the same location the
		// higher priority item would be if there was no key clash.

		// First, check non-array subelements keep order of highest priority items

		$result = array('Foo' => 1, 'Bar' => 2);
		Config::merge_array_high_into_low($result, array('Bar' => 3, 'Foo' => 4));

		$this->assertEquals(array_keys($result), array('Bar', 'Foo'));

		// Then check array subelements do too

		$result = array(
			'Foo' => array('F1' => 1),
			'Bar' => array('B1' => 1)
		);
		Config::merge_array_high_into_low($result, array(
			'Bar' => array('B2' => 2),
			'Foo' => array('F2' => 2),
		));

		$this->assertEquals(array_keys($result), array('Bar', 'Foo'));

		// What about when there's a mix of associative & sequential keys?

		$result = array(
			'Foo' => 'FooL',
			'Zap',
			'Bar' => 'BarL',
			'Baz' => 'BazL'
		);
		Config::merge_array_high_into_low($result, array(
			'Bar' => 'BarH',
			'Zop',
			'Zup',
			'Foo' => 'FooH'
		));

		$this->assertEquals(array_keys($result), array('Bar', 0, 1, 'Foo', 2, 'Baz'));
		$this->assertEquals(array_values($result), array('BarH', 'Zop', 'Zup', 'FooH', 'Zap', 'BazL'));
	}
	
	public function testStaticLookup() {
		$this->assertEquals(Object::static_lookup('ConfigTest_DefinesFoo', 'foo'), 1);
		$this->assertEquals(Object::static_lookup('ConfigTest_DefinesFoo', 'bar'), null);

		$this->assertEquals(Object::static_lookup('ConfigTest_DefinesBar', 'foo'), null);
		$this->assertEquals(Object::static_lookup('ConfigTest_DefinesBar', 'bar'), 2);

		$this->assertEquals(Object::static_lookup('ConfigTest_DefinesFooAndBar', 'foo'), 3);
		$this->assertEquals(Object::static_lookup('ConfigTest_DefinesFooAndBar', 'bar'), 3);

		$this->assertEquals(Object::static_lookup('ConfigTest_DefinesFooDoesntExtendObject', 'foo'), 4);
		$this->assertEquals(Object::static_lookup('ConfigTest_DefinesFooDoesntExtendObject', 'bar'), null);
	}

	public function testFragmentOrder() {
		$this->markTestIncomplete();
	}
	
}
